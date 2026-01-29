import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaSearch, FaPlus, FaEdit, FaSpinner, FaCheckCircle, FaTimesCircle, FaUsers, FaCalendar, FaGraduationCap, FaList } from 'react-icons/fa';
import { paymentsService, usersService, coursesService, payrollService, getDocument } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
import './OrganizationPayments.css';

const OrganizationPayments = () => {
  const { getOrganizationId } = useAuth();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [viewMode, setViewMode] = useState('students'); // 'students' or 'payments'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentsList, setShowPaymentsList] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentPayments, setSelectedStudentPayments] = useState([]);
  const [paymentSuccessForNotify, setPaymentSuccessForNotify] = useState(null); // { studentName, amount, month, year, className } after recording payment
  const paymentModalErrorRef = useRef(null);
  const pageErrorRef = useRef(null);
  const [formData, setFormData] = useState({
    amount: '',
    month: '',
    year: '',
    status: 'completed',
    paymentMethod: '',
    transactionId: '',
    notes: '',
    classId: '', // Link payment to a specific class
    classIds: [] // Support multiple classes
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!error) return;
    if (showPaymentModal && selectedStudent && !paymentSuccessForNotify) {
      paymentModalErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      pageErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error, showPaymentModal, selectedStudent, paymentSuccessForNotify]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setError('Organization ID is missing');
        setLoading(false);
        return;
      }

      const [paymentsData, usersData, coursesData] = await Promise.all([
        paymentsService.getAll(1000, orgId, true).catch(() => []),
        usersService.getAll(1000, orgId, true).catch(() => []),
        coursesService.getAll(1000, orgId, true).catch(() => [])
      ]);
      
      // Filter only students
      const studentsList = (usersData || []).filter(user => {
        const role = user.role ? user.role.toLowerCase() : '';
        return role === 'student';
      });
      
      setStudents(studentsList);
      setPayments(paymentsData || []);
      setCourses(coursesData || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentPayments = (studentId) => {
    return payments.filter(p => p.userId === studentId);
  };

  const getClassName = (classId) => {
    if (!classId) return 'All Classes';
    const course = courses.find(c => c.id === classId);
    return course ? (course.title || course.name || 'Unknown') : 'Unknown';
  };

  const getClassNames = (classIds) => {
    if (!classIds || classIds.length === 0) return 'All Classes';
    if (Array.isArray(classIds)) {
      return classIds.map(id => getClassName(id)).join(', ');
    }
    return getClassName(classIds);
  };

  const getStudentTotalPaid = (studentId) => {
    const studentPayments = getStudentPayments(studentId);
    return studentPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  };

  const getStudentLastPayment = (studentId) => {
    const studentPayments = getStudentPayments(studentId);
    if (studentPayments.length === 0) return null;
    return studentPayments.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    })[0];
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      (payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (getClassName(payment.classId)?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClass = filterClass === 'all' || 
      payment.classId === filterClass ||
      (payment.classIds && Array.isArray(payment.classIds) && payment.classIds.includes(filterClass));
    
    return matchesSearch && matchesClass;
  });

  const handleAddPayment = (student) => {
    setPaymentSuccessForNotify(null);
    setSelectedStudent(student);
    // Set current month and year as default
    const now = new Date();
    
    // Get student's enrolled classes
    const studentClassIds = student.classIds || student.batchIds || [];
    
    setFormData({
      amount: '',
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear().toString(),
      status: 'completed',
      paymentMethod: '',
      transactionId: '',
      notes: '',
      classId: studentClassIds.length === 1 ? studentClassIds[0] : '',
      classIds: studentClassIds.length > 1 ? studentClassIds : []
    });
    setShowPaymentModal(true);
  };

  const handleViewPayments = (student) => {
    setSelectedStudent(student);
    const studentPayments = getStudentPayments(student.id);
    setSelectedStudentPayments(studentPayments);
    setShowPaymentsList(true);
  };

  // Function to automatically create payroll entries from payment
  const createPayrollFromPayment = async (payment, paymentId) => {
    console.log('🔄 Starting automatic payroll generation for payment:', paymentId);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:158',message:'createPayrollFromPayment called',data:{paymentId,status:payment.status,amount:payment.amount,classId:payment.classId,classIds:payment.classIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      const orgId = getOrganizationId();
      console.log('📋 Payment details:', { paymentId, status: payment.status, amount: payment.amount, classId: payment.classId, classIds: payment.classIds, orgId });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:161',message:'Checking orgId and payment status',data:{orgId,paymentStatus:payment.status,willProceed:orgId && payment.status === 'completed'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (!orgId || payment.status !== 'completed') {
        console.log('⏭️ Skipping payroll generation:', !orgId ? 'No organization ID' : 'Payment status is not completed');
        return; // Only create payroll for completed payments
      }

      // Get organization settings for salary percentages
      const orgDoc = await getDocument('organizations', orgId).catch(() => null);
      if (!orgDoc) {
        console.warn('⚠️ Organization settings not found, skipping automatic payroll creation');
        return;
      }

      const teacherSalaryPercentage = orgDoc.teacherSalaryPercentage || 75;
      const organizationSalaryPercentage = orgDoc.organizationSalaryPercentage || 25;
      console.log(`💰 Using salary split: ${teacherSalaryPercentage}% teacher, ${organizationSalaryPercentage}% organization`);

      // Get class IDs from payment
      const classIds = payment.classId 
        ? [payment.classId] 
        : (payment.classIds && payment.classIds.length > 0 ? payment.classIds : []);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:176',message:'Extracted class IDs from payment',data:{classIds,classIdCount:classIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (classIds.length === 0) {
        console.warn('No class IDs in payment, skipping automatic payroll creation');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:181',message:'No class IDs found, skipping',data:{paymentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return;
      }

      // Get all users to find teachers
      const allUsers = await usersService.getAll(1000, orgId, true).catch(() => []);
      const teachers = allUsers.filter(user => {
        const role = user.role ? user.role.toLowerCase() : '';
        return role === 'teacher' || role === 'instructor';
      });
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:186',message:'Loaded teachers',data:{totalUsers:allUsers.length,teachersCount:teachers.length,teacherIds:teachers.map(t=>t.id || t.uid)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Get courses to find teachers
      const allCourses = await coursesService.getAll(1000, orgId, true).catch(() => []);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:193',message:'Loaded courses',data:{totalCourses:allCourses.length,relevantCourseIds:classIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Map to track teacher payments (to avoid duplicates if multiple classes have same teacher)
      const teacherPayrollMap = new Map();

      // Process each class
      console.log(`🔍 Processing ${classIds.length} class(es) for payroll generation`);
      for (const classId of classIds) {
        const course = allCourses.find(c => c.id === classId || String(c.id) === String(classId));
        if (!course) {
          console.warn(`⚠️ Course not found for classId: ${classId}`);
          continue;
        }
        console.log(`📚 Found course: "${course.title || course.name}" (ID: ${course.id})`);

        // Find teachers for this course
        const courseTeachers = [];

        // Check instructor name match
        if (course.instructor) {
          const teacherByName = teachers.find(t => t.name === course.instructor || (t.name && t.name.toLowerCase() === course.instructor.toLowerCase()));
          if (teacherByName) {
            courseTeachers.push(teacherByName);
            console.log(`  ✓ Matched teacher by name: ${teacherByName.name || teacherByName.email}`);
          } else {
            console.log(`  ⚠️ No teacher found with name: "${course.instructor}"`);
          }
        }

        // Check createdBy
        if (course.createdBy) {
          const teacherById = teachers.find(t => t.id === course.createdBy || t.uid === course.createdBy || String(t.id) === String(course.createdBy) || String(t.uid) === String(course.createdBy));
          if (teacherById && !courseTeachers.find(t => (t.id === teacherById.id || t.uid === teacherById.uid))) {
            courseTeachers.push(teacherById);
            console.log(`  ✓ Matched teacher by ID: ${teacherById.name || teacherById.email} (${course.createdBy})`);
          }
        }

        // Check assignedTeachers
        if (course.assignedTeachers && Array.isArray(course.assignedTeachers)) {
          course.assignedTeachers.forEach(teacherId => {
            const teacher = teachers.find(t => (t.id === teacherId || t.uid === teacherId || String(t.id) === String(teacherId) || String(t.uid) === String(teacherId)));
            if (teacher && !courseTeachers.find(t => (t.id === teacher.id || t.uid === teacher.uid))) {
              courseTeachers.push(teacher);
            }
          });
        }
        console.log(`👨‍🏫 Found ${courseTeachers.length} teacher(s) for course "${course.title || course.name}":`, courseTeachers.map(t => t.name || t.email));
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:228',message:'Found teachers for course',data:{courseId:classId,courseName:course.title || course.name,teachersFound:courseTeachers.length,teacherIds:courseTeachers.map(t=>t.id || t.uid),instructor:course.instructor,createdBy:course.createdBy,assignedTeachers:course.assignedTeachers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        // Calculate payment per teacher (if multiple teachers, split equally)
        const paymentAmount = parseFloat(payment.amount) || 0;
        const teacherSharePerClass = paymentAmount / Math.max(courseTeachers.length || 1, 1);
        const teacherSalaryPerClass = teacherSharePerClass * (teacherSalaryPercentage / 100);
        console.log(`📐 Class "${course.title || course.name}": ${courseTeachers.length} teacher(s), Payment: $${paymentAmount}, Teacher share: $${teacherSalaryPerClass.toFixed(2)} per teacher`);

        // Add to teacher payroll map
        courseTeachers.forEach(teacher => {
          const teacherId = teacher.id || teacher.uid;
          if (!teacherId) return;

          if (teacherPayrollMap.has(teacherId)) {
            const existing = teacherPayrollMap.get(teacherId);
            existing.baseSalary += teacherSalaryPerClass;
            existing.classes.push({
              classId: classId,
              className: course.title || course.name || 'Unknown',
              paymentAmount: teacherSharePerClass,
              teacherSalary: teacherSalaryPerClass
            });
          } else {
            teacherPayrollMap.set(teacherId, {
              teacherId: teacherId,
              teacherName: teacher.name || teacher.email || 'Unknown',
              baseSalary: teacherSalaryPerClass,
              classes: [{
                classId: classId,
                className: course.title || course.name || 'Unknown',
                paymentAmount: teacherSharePerClass,
                teacherSalary: teacherSalaryPerClass
              }]
            });
          }
        });
      }

      // Create payroll entries for each teacher
      const payPeriod = `${payment.year}-${payment.month.padStart(2, '0')}`;
      const paymentAmount = parseFloat(payment.amount) || 0;

      // Get existing payrolls for this pay period
      const existingPayrolls = await payrollService.getAll(1000, orgId, false).catch(() => []);

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:272',message:'Processing teacher payroll map',data:{teacherCount:teacherPayrollMap.size,payPeriod,paymentAmount,existingPayrollsCount:existingPayrolls.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      for (const [teacherId, payrollData] of teacherPayrollMap) {
        // Check if payroll already exists for this teacher and pay period (aggregate all payments)
        const existingPayroll = existingPayrolls.find(p => 
          p.employeeId === teacherId && 
          p.payPeriod === payPeriod &&
          p.calculationType === 'automatic'
        );
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:279',message:'Checking for existing payroll',data:{teacherId,payPeriod,hasExisting:!!existingPayroll,existingPayrollId:existingPayroll?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        if (existingPayroll) {
          // Update existing payroll by adding new payment amount
          const currentBaseSalary = parseFloat(existingPayroll.baseSalary || 0);
          const newBaseSalary = currentBaseSalary + payrollData.baseSalary;
          const currentAllowances = parseFloat(existingPayroll.allowances || 0);
          const currentBonus = parseFloat(existingPayroll.bonus || 0);
          const currentDeductions = parseFloat(existingPayroll.deductions || 0);
          const newNetSalary = newBaseSalary + currentAllowances + currentBonus - currentDeductions;

          // Update payment IDs array if it exists, otherwise create it
          const paymentIds = existingPayroll.paymentIds || [];
          if (!paymentIds.includes(paymentId)) {
            paymentIds.push(paymentId);
          }

          await payrollService.update(existingPayroll.id, {
            baseSalary: newBaseSalary.toFixed(2),
            netSalary: newNetSalary.toFixed(2),
            paymentIds: paymentIds,
            status: existingPayroll.status || 'pending', // Preserve status, default to pending
            notes: `${existingPayroll.notes || ''}\nAdded: Payment ${payment.transactionId || paymentId} ($${paymentAmount.toFixed(2)}). Teacher receives ${teacherSalaryPercentage}% ($${payrollData.baseSalary.toFixed(2)}). Classes: ${payrollData.classes.map(c => c.className).join(', ')}.`,
            updatedAt: serverTimestamp()
          });
          console.log(`🔄 Updated existing payroll for teacher ${payrollData.teacherName}:`, {
            payrollId: existingPayroll.id,
            oldBaseSalary: currentBaseSalary,
            newBaseSalary,
            newNetSalary
          });
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:302',message:'Updated existing payroll',data:{payrollId:existingPayroll.id,teacherId,newBaseSalary,newNetSalary},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        } else {
          // Create new payroll entry
          const payrollEntry = {
            employeeId: teacherId,
            employeeName: payrollData.teacherName,
            payPeriod: payPeriod,
            baseSalary: payrollData.baseSalary.toFixed(2),
            allowances: '0',
            deductions: '0',
            bonus: '0',
            status: 'pending',
            paymentMethod: 'bank_transfer',
            calculationType: 'automatic',
            organizationId: orgId,
            paymentId: paymentId, // Keep for backward compatibility
            paymentIds: [paymentId], // Array of payment IDs for this payroll
            notes: `Auto-created from payment ${payment.transactionId || paymentId} ($${paymentAmount.toFixed(2)}). Teacher receives ${teacherSalaryPercentage}% ($${payrollData.baseSalary.toFixed(2)}). Classes: ${payrollData.classes.map(c => c.className).join(', ')}.`,
            netSalary: payrollData.baseSalary.toFixed(2),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          const createdPayrollId = await payrollService.create(payrollEntry);
          console.log(`✅ Created new payroll entry for teacher ${payrollData.teacherName}:`, {
            payrollId: createdPayrollId,
            teacherId,
            baseSalary: payrollData.baseSalary,
            payPeriod,
            status: 'pending'
          });
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:325',message:'Created new payroll entry',data:{payrollId:createdPayrollId,teacherId,baseSalary:payrollData.baseSalary,payPeriod,status:'pending'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
      }

      if (teacherPayrollMap.size > 0) {
        console.log(`✅ Created/updated ${teacherPayrollMap.size} payroll entry(ies) from payment ${paymentId}`);
        console.log('📊 Payroll Details:', Array.from(teacherPayrollMap.entries()).map(([id, data]) => ({
          teacherId: id,
          teacherName: data.teacherName,
          baseSalary: data.baseSalary,
          classes: data.classes.map(c => c.className)
        })));
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:330',message:'Payroll generation completed successfully',data:{paymentId,payrollsCreated:teacherPayrollMap.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } else {
        console.warn(`⚠️ No teachers found for payment ${paymentId}. Classes: ${classIds.join(', ')}`);
        console.warn('💡 Make sure the classes have teachers assigned via instructor, createdBy, or assignedTeachers fields.');
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:332',message:'No teachers found for payment classes',data:{paymentId,classIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
    } catch (err) {
      console.error('Error creating automatic payroll from payment:', err);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:333',message:'Error in createPayrollFromPayment',data:{paymentId,error:err.message,errorCode:err.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      // Don't throw error - payment should still be created even if payroll creation fails
    }
  };

  const handleSubmitPayment = async () => {
    try {
      setError(null);
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setError('Organization ID is missing');
        return;
      }
      
      if (!formData.amount || !formData.month || !formData.year) {
        setError('Amount, month, and year are required.');
        return;
      }

      // Determine classId(s) - prefer classId, fallback to classIds array
      const classIds = formData.classId 
        ? [formData.classId] 
        : (formData.classIds && formData.classIds.length > 0 ? formData.classIds : []);

      const paymentData = {
        userId: selectedStudent.id,
        amount: parseFloat(formData.amount).toFixed(2),
        status: formData.status,
        paymentMethod: formData.paymentMethod || 'Manual',
        transactionId: formData.transactionId || `TXN-${Date.now()}`,
        month: formData.month,
        year: formData.year,
        notes: formData.notes || '',
        classId: formData.classId || (classIds.length === 1 ? classIds[0] : null),
        classIds: classIds.length > 1 ? classIds : (classIds.length === 1 ? [classIds[0]] : []),
        organizationId: orgId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const paymentResult = await paymentsService.create(paymentData);
      const paymentId = paymentResult?.id || paymentResult;
      
      // Automatically create payroll entries from this payment
      if (paymentData.status === 'completed') {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:378',message:'Payment is completed, triggering payroll generation',data:{paymentId,amount:paymentData.amount,classId:paymentData.classId,classIds:paymentData.classIds},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Create a clean payment object for payroll creation (without serverTimestamp)
        const paymentForPayroll = {
          ...paymentData,
          id: paymentId,
          amount: paymentData.amount,
          status: paymentData.status,
          month: paymentData.month,
          year: paymentData.year,
          classId: paymentData.classId,
          classIds: paymentData.classIds,
          transactionId: paymentData.transactionId
        };
        console.log('🚀 Triggering automatic payroll generation...');
        await createPayrollFromPayment(paymentForPayroll, paymentId);
        console.log('✨ Payroll generation process completed');
      } else {
        console.log(`⏭️ Payment status is "${paymentData.status}", skipping automatic payroll generation (only "completed" payments generate payroll)`);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/f77a4f94-9b0c-4532-8883-20faad65ce24',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrganizationPayments.jsx:392',message:'Payment status not completed, skipping payroll generation',data:{paymentId,status:paymentData.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
      }
      
      await loadData();
      const className = getClassName(classIds[0]) || getClassNames(classIds);
      setPaymentSuccessForNotify({
        studentName: selectedStudent.name || selectedStudent.email,
        amount: paymentData.amount,
        month: formData.month,
        year: formData.year,
        className
      });
      if (paymentData.status === 'completed') {
        toast.success(`Payment recorded successfully for ${selectedStudent.name}! Teacher payroll entries have been automatically created and added to pending payments.`);
      } else {
        toast.success(`Payment recorded successfully for ${selectedStudent.name}!`);
      }
    } catch (err) {
      setError('Failed to record payment. Please try again.');
      console.error('Error creating payment:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      month: '',
      year: '',
      status: 'completed',
      paymentMethod: '',
      transactionId: '',
      notes: '',
      classId: '',
      classIds: []
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return timestamp;
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMonthName = (monthNumber) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(monthNumber) - 1] || monthNumber;
  };

  const stats = {
    totalStudents: students.length,
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.status === 'completed').length,
    totalRevenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  };

  return (
    <div className="organization-payments-container">
      <div className="organization-payments-card">
        {error && (
          <div ref={pageErrorRef} className="error-message">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="organization-payments-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaMoneyBillWave className="header-icon" />
            </div>
            <div>
              <h1 className="organization-payments-title">Payments Management</h1>
              <p className="organization-payments-subtitle">Manage monthly payments for all students</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="payments-stats-grid">
          <div className="payments-stat-card">
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{stats.totalPayments}</div>
            <div className="stat-label">Total Payments</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{stats.completedPayments}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="payments-stat-card">
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="payments-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder={viewMode === 'students' ? "Search students by name or email..." : "Search payments by transaction ID or class..."} 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.25rem', borderRadius: '0.5rem' }}>
              <button
                className={`view-mode-btn ${viewMode === 'students' ? 'active' : ''}`}
                onClick={() => setViewMode('students')}
              >
                <FaUsers />
                Students
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'payments' ? 'active' : ''}`}
                onClick={() => setViewMode('payments')}
              >
                <FaList />
                All Payments
              </button>
            </div>
            {viewMode === 'payments' && (
              <select 
                className="filter-select"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
              >
                <option value="all">All Classes</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title || course.name || 'Untitled'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Students Table */}
        {viewMode === 'students' ? (
          <div className="payments-table-container">
            {loading ? (
              <div className="loading-state">
                <FaSpinner className="spinner" />
                <p>Loading students...</p>
              </div>
            ) : (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Enrolled Classes</th>
                    <th>Total Paid</th>
                    <th>Last Payment</th>
                    <th>Payment Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        {searchTerm ? 'No students found matching your search' : 'No students found'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const studentPayments = getStudentPayments(student.id);
                      const lastPayment = getStudentLastPayment(student.id);
                      const totalPaid = getStudentTotalPaid(student.id);
                      const studentClassIds = student.classIds || student.batchIds || [];
                      
                      return (
                        <tr key={student.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FaUsers style={{ color: '#6b7280' }} />
                              <strong>{student.name || 'N/A'}</strong>
                            </div>
                          </td>
                          <td>{student.email || 'N/A'}</td>
                          <td>
                            {studentClassIds.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {studentClassIds.slice(0, 2).map(classId => (
                                  <span key={classId} style={{
                                    padding: '0.25rem 0.5rem',
                                    background: '#eff6ff',
                                    color: '#1e40af',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem'
                                  }}>
                                    {getClassName(classId)}
                                  </span>
                                ))}
                                {studentClassIds.length > 2 && (
                                  <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    +{studentClassIds.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No classes</span>
                            )}
                          </td>
                          <td className="amount-cell">{formatCurrency(totalPaid)}</td>
                          <td>
                            {lastPayment ? (
                              <div>
                                <div>{formatDate(lastPayment.createdAt || lastPayment.date)}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {lastPayment.month && lastPayment.year 
                                    ? `${getMonthName(lastPayment.month)} ${lastPayment.year}`
                                    : ''}
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>No payments</span>
                            )}
                          </td>
                          <td>
                            <span style={{ 
                              padding: '0.25rem 0.75rem', 
                              background: '#eff6ff', 
                              color: '#1e40af',
                              borderRadius: '0.375rem',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}>
                              {studentPayments.length}
                            </span>
                          </td>
                          <td style={{ minWidth: '180px', overflow: 'visible' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', overflow: 'visible' }}>
                              <button 
                                className="action-btn edit-btn"
                                title="Add Payment"
                                onClick={() => handleAddPayment(student)}
                                style={{
                                  padding: '0.625rem 1.25rem',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  cursor: 'pointer',
                                  fontSize: '0.875rem',
                                  fontWeight: '600',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  whiteSpace: 'nowrap',
                                  minHeight: '2.5rem',
                                  minWidth: '130px',
                                  lineHeight: '1.2',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                  overflow: 'visible',
                                  textOverflow: 'clip'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#2563eb';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#3b82f6';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                                }}
                              >
                                <FaPlus />
                                <span style={{ overflow: 'visible', textOverflow: 'clip' }}>Add Payment</span>
                              </button>
                              {studentPayments.length > 0 && (
                                <button 
                                  className="action-btn"
                                  title="View Payments"
                                  onClick={() => handleViewPayments(student)}
                                  style={{
                                    padding: '0.625rem 1.25rem',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    whiteSpace: 'nowrap',
                                    minHeight: '2.5rem',
                                    minWidth: '90px',
                                    lineHeight: '1.2',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                    overflow: 'visible',
                                    textOverflow: 'clip'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#059669';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#10b981';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
                                  }}
                                >
                                  <FaList />
                                  <span style={{ overflow: 'visible', textOverflow: 'clip' }}>View</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="payments-table-container">
            {loading ? (
              <div className="loading-state">
                <FaSpinner className="spinner" />
                <p>Loading payments...</p>
              </div>
            ) : (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Amount</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Payment Method</th>
                    <th>Transaction ID</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-state">
                        {searchTerm || filterClass !== 'all' ? 'No payments found matching your filters' : 'No payments found'}
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => {
                      const student = students.find(s => s.id === payment.userId);
                      return (
                        <tr key={payment.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FaUsers style={{ color: '#6b7280' }} />
                              <strong>{student?.name || 'Unknown'}</strong>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FaGraduationCap style={{ color: '#8b5cf6' }} />
                              <span>{getClassNames(payment.classId || payment.classIds)}</span>
                            </div>
                          </td>
                          <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                          <td>
                            {payment.month && payment.year 
                              ? `${getMonthName(payment.month)} ${payment.year}`
                              : formatDate(payment.createdAt)}
                          </td>
                          <td>
                            <span className={`status-badge status-${payment.status || 'pending'}`}>
                              {payment.status === 'completed' && <FaCheckCircle className="status-icon" />}
                              {payment.status === 'pending' && <FaSpinner className="status-icon spinner" />}
                              {payment.status === 'failed' && <FaTimesCircle className="status-icon" />}
                              {payment.status || 'pending'}
                            </span>
                          </td>
                          <td>{payment.paymentMethod || 'N/A'}</td>
                          <td className="transaction-id">{payment.transactionId || 'N/A'}</td>
                          <td>{formatDate(payment.createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{paymentSuccessForNotify ? 'Payment recorded' : 'Add Monthly Payment'}</h2>
              <button className="modal-close" onClick={() => { setShowPaymentModal(false); setSelectedStudent(null); setPaymentSuccessForNotify(null); resetForm(); }}>×</button>
            </div>
            <div className="modal-body">
              {paymentSuccessForNotify ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <FaCheckCircle style={{ fontSize: '2.5rem', color: '#16a34a', marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Payment recorded successfully for {paymentSuccessForNotify.studentName}.
                  </p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {formatCurrency(paymentSuccessForNotify.amount)} — {getMonthName(paymentSuccessForNotify.month)} {paymentSuccessForNotify.year}
                    {paymentSuccessForNotify.className && ` (${paymentSuccessForNotify.className})`}
                  </p>
                </div>
              ) : (
                <>
              {error && (
                <div ref={paymentModalErrorRef} className="error-message" style={{ marginBottom: '1rem' }}>
                  {error}
                </div>
              )}
              <div style={{ 
                padding: '1rem', 
                background: '#eff6ff', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: '#1e40af'
              }}>
                <strong>Student:</strong> {selectedStudent.name} ({selectedStudent.email})
              </div>

              <div className="form-group">
                <label>Class/Course *</label>
                <select
                  value={formData.classId}
                  onChange={(e) => {
                    const selectedClassId = e.target.value;
                    // If student is enrolled in this class, pre-fill it
                    const studentClassIds = selectedStudent.classIds || selectedStudent.batchIds || [];
                    setFormData({
                      ...formData,
                      classId: selectedClassId,
                      classIds: selectedClassId ? [selectedClassId] : []
                    });
                  }}
                  required
                >
                  <option value="">Select Class</option>
                  {courses.map(course => {
                    const studentClassIds = selectedStudent.classIds || selectedStudent.batchIds || [];
                    const isEnrolled = studentClassIds.includes(course.id);
                    return (
                      <option key={course.id} value={course.id}>
                        {course.title || course.name || 'Untitled'} {isEnrolled ? '(Enrolled)' : ''}
                      </option>
                    );
                  })}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Select the class this payment is for. This links the payment to the class for teacher salary calculation.
                </p>
              </div>

              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: e.target.value})}
                    required
                  >
                    <option value="">Select Month</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthNum = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={monthNum} value={monthNum}>
                          {getMonthName(monthNum)}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    placeholder="YYYY"
                    min="2020"
                    max="2100"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  placeholder="e.g., Cash, Bank Transfer, Credit Card"
                />
              </div>

              <div className="form-group">
                <label>Transaction ID</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                  placeholder="Auto-generated if left empty"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                  rows="3"
                />
              </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {paymentSuccessForNotify ? (
                <button className="btn-primary" onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedStudent(null);
                  setPaymentSuccessForNotify(null);
                  resetForm();
                }}>Close</button>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedStudent(null);
                    setPaymentSuccessForNotify(null);
                    resetForm();
                  }}>Cancel</button>
                  <button className="btn-primary" onClick={handleSubmitPayment}>Record Payment</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Student Payments Modal */}
      {showPaymentsList && selectedStudent && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>Payments for {selectedStudent.name}</h2>
              <button className="modal-close" onClick={() => {
                setShowPaymentsList(false);
                setSelectedStudent(null);
                setSelectedStudentPayments([]);
              }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                padding: '1rem', 
                background: '#eff6ff', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                fontSize: '0.875rem',
                color: '#1e40af'
              }}>
                <strong>Student:</strong> {selectedStudent.name} ({selectedStudent.email})<br />
                <strong>Total Paid:</strong> {formatCurrency(getStudentTotalPaid(selectedStudent.id))}<br />
                <strong>Total Payments:</strong> {selectedStudentPayments.length}
              </div>

              {selectedStudentPayments.length === 0 ? (
                <div className="empty-state">
                  <p>No payments found for this student</p>
                </div>
              ) : (
                <div className="payments-table-container">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Amount</th>
                        <th>Period</th>
                        <th>Status</th>
                        <th>Payment Method</th>
                        <th>Transaction ID</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudentPayments
                        .sort((a, b) => {
                          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                          return dateB - dateA;
                        })
                        .map((payment) => (
                          <tr key={payment.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaGraduationCap style={{ color: '#8b5cf6' }} />
                                <span>{getClassNames(payment.classId || payment.classIds)}</span>
                              </div>
                            </td>
                            <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                            <td>
                              {payment.month && payment.year 
                                ? `${getMonthName(payment.month)} ${payment.year}`
                                : formatDate(payment.createdAt)}
                            </td>
                            <td>
                              <span className={`status-badge status-${payment.status || 'pending'}`}>
                                {payment.status === 'completed' && <FaCheckCircle className="status-icon" />}
                                {payment.status === 'pending' && <FaSpinner className="status-icon spinner" />}
                                {payment.status === 'failed' && <FaTimesCircle className="status-icon" />}
                                {payment.status || 'pending'}
                              </span>
                            </td>
                            <td>{payment.paymentMethod || 'N/A'}</td>
                            <td className="transaction-id">{payment.transactionId || 'N/A'}</td>
                            <td>{formatDate(payment.createdAt)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowPaymentsList(false);
                setSelectedStudent(null);
                setSelectedStudentPayments([]);
              }}>Close</button>
              <button className="btn-primary" onClick={() => {
                setShowPaymentsList(false);
                handleAddPayment(selectedStudent);
              }}>
                <FaPlus style={{ marginRight: '0.5rem' }} />
                Add New Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPayments;
