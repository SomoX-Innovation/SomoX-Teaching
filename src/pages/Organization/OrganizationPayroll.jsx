import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaDollarSign, FaSearch, FaPlus, FaEdit, FaTrash, FaSpinner, FaCheckCircle, FaTimesCircle, FaUsers, FaCalendar, FaFileInvoiceDollar, FaCalculator, FaPercentage, FaCheckDouble, FaSync, FaCog } from 'react-icons/fa';
import { payrollService, usersService, paymentsService, coursesService, getDocument } from '../../services/firebaseService';
import { useAuth } from '../../context/AuthContext';
import { serverTimestamp } from 'firebase/firestore';
import './OrganizationPayroll.css';

const OrganizationPayroll = () => {
  const { getOrganizationId } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayPeriod, setFilterPayPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
  const [selectedPayrolls, setSelectedPayrolls] = useState([]); // For bulk actions
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    payPeriod: '',
    baseSalary: '',
    allowances: '',
    deductions: '',
    bonus: '',
    status: 'pending',
    paymentMethod: 'bank_transfer',
    notes: '',
    calculationType: 'manual' // 'manual' or 'automatic'
  });
  const [organizationSettings, setOrganizationSettings] = useState({
    teacherSalaryPercentage: 75,
    organizationSalaryPercentage: 25
  });
  const [showAutoCalcModal, setShowAutoCalcModal] = useState(false);
  const [autoCalcData, setAutoCalcData] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [processingAllPayments, setProcessingAllPayments] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, month: '' });

  useEffect(() => {
    loadData();
    loadOrganizationSettings();
  }, []);

  // Reload settings when component becomes visible (user might have changed settings)
  useEffect(() => {
    const handleFocus = () => {
      loadOrganizationSettings();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadOrganizationSettings = async () => {
    try {
      const orgId = getOrganizationId();
      if (orgId) {
        const orgDoc = await getDocument('organizations', orgId).catch(() => null);
        if (orgDoc) {
          setOrganizationSettings({
            teacherSalaryPercentage: orgDoc.teacherSalaryPercentage || 75,
            organizationSalaryPercentage: orgDoc.organizationSalaryPercentage || 25
          });
        }
      }
    } catch (err) {
      console.error('Error loading organization settings:', err);
    }
  };

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

      const [payrollsData, usersData] = await Promise.all([
        payrollService.getAll(1000, orgId, true).catch(() => []),
        usersService.getAll(1000, orgId, true).catch(() => [])
      ]);
      
      // Filter only teachers and admins (employees)
      const employeesList = (usersData || []).filter(user => {
        const role = user.role ? user.role.toLowerCase() : '';
        return role === 'teacher' || role === 'instructor' || role === 'admin';
      });
      
      setEmployees(employeesList);
      setPayrolls(payrollsData || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? (employee.name || employee.email || 'Unknown') : 'Unknown';
  };

  const calculateNetSalary = (payroll) => {
    const base = parseFloat(payroll.baseSalary) || 0;
    const allowances = parseFloat(payroll.allowances) || 0;
    const bonus = parseFloat(payroll.bonus) || 0;
    const deductions = parseFloat(payroll.deductions) || 0;
    return base + allowances + bonus - deductions;
  };

  // Calculate teacher salary from student payments for their courses
  const calculateTeacherSalaryFromPayments = async (teacherId, payPeriod) => {
    try {
      setCalculating(true);
      const orgId = getOrganizationId();
      
      // Get teacher info
      const teacher = employees.find(e => e.id === teacherId);
      if (!teacher) {
        throw new Error('Teacher not found');
      }
      
      // Get all courses where teacher is instructor
      const allCourses = await coursesService.getAll(1000, orgId, true).catch(() => []);
      const teacherCourses = allCourses.filter(course => {
        // Check if teacher is instructor by name
        if (course.instructor && teacher.name && course.instructor === teacher.name) {
          return true;
        }
        // Check if teacher created the course
        if (course.createdBy === teacherId) {
          return true;
        }
        // Check if teacher is assigned
        if (course.assignedTeachers && Array.isArray(course.assignedTeachers)) {
          return course.assignedTeachers.includes(teacherId);
        }
        return false;
      });

      if (teacherCourses.length === 0) {
        return {
          totalPayments: 0,
          teacherSalary: 0,
          organizationShare: 0,
          courseBreakdown: [],
          paymentCount: 0
        };
      }

      const courseIds = teacherCourses.map(c => c.id);
      
      // Get all students and payments
      const [allPayments, allStudents] = await Promise.all([
        paymentsService.getAll(1000, orgId, true).catch(() => []),
        usersService.getByRole('student', 1000, orgId, true).catch(() => [])
      ]);
      
      // Get all payments for the pay period
      const [year, month] = payPeriod.split('-');
      
      // Filter payments by period
      const periodPayments = allPayments.filter(payment => {
        // Check if payment is for the pay period
        const paymentYear = payment.year || (payment.createdAt?.toDate ? payment.createdAt.toDate().getFullYear() : null);
        const paymentMonth = payment.month || (payment.createdAt?.toDate ? payment.createdAt.toDate().getMonth() + 1 : null);
        
        if (paymentYear && paymentMonth) {
          if (paymentYear.toString() !== year || paymentMonth.toString().padStart(2, '0') !== month.padStart(2, '0')) {
            return false;
          }
        }
        
        // Check if payment is completed/paid
        return payment.status === 'completed' || payment.status === 'paid';
      });
      
      // Filter payments where student is enrolled in teacher's courses
      const relevantPayments = periodPayments.filter(payment => {
        const student = allStudents.find(s => s.id === payment.userId);
        if (!student) return false;
        
        const studentClassIds = (student.classIds || []).map(id => String(id).trim().toLowerCase());
        const studentBatchIds = (student.batchIds || []).map(id => String(id).trim().toLowerCase());
        const courseIdsLower = courseIds.map(id => String(id).trim().toLowerCase());
        
        // Check if student is enrolled in any teacher course
        return studentClassIds.some(cid => courseIdsLower.includes(cid)) ||
               studentBatchIds.some(bid => courseIdsLower.includes(bid));
      });

      const totalPayments = relevantPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      const teacherPercentage = organizationSettings.teacherSalaryPercentage / 100;
      const teacherSalary = totalPayments * teacherPercentage;
      const organizationShare = totalPayments * (organizationSettings.organizationSalaryPercentage / 100);

      // Create breakdown by course
      const courseBreakdown = teacherCourses.map(course => {
        const coursePayments = relevantPayments.filter(payment => {
          const student = allStudents.find(s => s.id === payment.userId);
          if (!student) return false;
          const studentClassIds = (student.classIds || []).map(id => String(id).trim().toLowerCase());
          const studentBatchIds = (student.batchIds || []).map(id => String(id).trim().toLowerCase());
          const courseIdLower = String(course.id).trim().toLowerCase();
          return studentClassIds.includes(courseIdLower) || studentBatchIds.includes(courseIdLower);
        });
        
        const courseTotal = coursePayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        return {
          courseId: course.id,
          courseName: course.title || course.name || 'Unknown',
          paymentCount: coursePayments.length,
          totalPayments: courseTotal,
          teacherShare: courseTotal * teacherPercentage
        };
      });

      return {
        totalPayments,
        teacherSalary,
        organizationShare,
        courseBreakdown,
        paymentCount: relevantPayments.length
      };
    } catch (err) {
      console.error('Error calculating teacher salary:', err);
      throw err;
    } finally {
      setCalculating(false);
    }
  };

  const handleAutoCalculate = async () => {
    try {
      if (!formData.employeeId || !formData.payPeriod) {
        toast.error('Please select employee and pay period first');
        return;
      }

      const calcData = await calculateTeacherSalaryFromPayments(formData.employeeId, formData.payPeriod);
      setAutoCalcData(calcData);
      setShowAutoCalcModal(true);
    } catch (err) {
      toast.error('Failed to calculate salary. Please try again.');
      console.error('Error calculating salary:', err);
    }
  };

  const handleApplyAutoCalculation = () => {
    if (!autoCalcData) return;
    
    setFormData(prev => ({
      ...prev,
      baseSalary: autoCalcData.teacherSalary.toFixed(2),
      calculationType: 'automatic',
      notes: `Auto-calculated from ${autoCalcData.paymentCount} student payment(s) totaling $${autoCalcData.totalPayments.toFixed(2)}. Teacher receives ${organizationSettings.teacherSalaryPercentage}% ($${autoCalcData.teacherSalary.toFixed(2)}).`
    }));
    
    setShowAutoCalcModal(false);
    setAutoCalcData(null);
    toast.success('Auto-calculation applied!');
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = 
      getEmployeeName(payroll.employeeId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.payPeriod?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || payroll.status === filterStatus;
    const matchesPayPeriod = filterPayPeriod === 'all' || payroll.payPeriod === filterPayPeriod;
    const matchesTab = activeTab === 'all' || (activeTab === 'pending' && payroll.status === 'pending');
    return matchesSearch && matchesStatus && matchesPayPeriod && matchesTab;
  });

  const uniquePayPeriods = [...new Set(payrolls.map(p => p.payPeriod).filter(Boolean))].sort().reverse();

  const handleAddPayroll = () => {
    setSelectedPayroll(null);
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear();
    setFormData({
      employeeId: '',
      employeeName: '',
      payPeriod: `${currentYear}-${currentMonth}`,
      baseSalary: '',
      allowances: '',
      deductions: '',
      bonus: '',
      status: 'pending',
      paymentMethod: 'bank_transfer',
      notes: '',
      calculationType: 'manual'
    });
    setShowAddModal(true);
  };

  const handleEditPayroll = (payroll) => {
    setSelectedPayroll(payroll);
    setFormData({
      employeeId: payroll.employeeId || '',
      employeeName: getEmployeeName(payroll.employeeId),
      payPeriod: payroll.payPeriod || '',
      baseSalary: payroll.baseSalary || '',
      allowances: payroll.allowances || '',
      deductions: payroll.deductions || '',
      bonus: payroll.bonus || '',
      status: payroll.status || 'pending',
      paymentMethod: payroll.paymentMethod || 'bank_transfer',
      notes: payroll.notes || '',
      calculationType: payroll.calculationType || 'manual'
    });
    setShowEditModal(true);
  };

  const handleSubmitPayroll = async () => {
    try {
      setError(null);
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setError('Organization ID is missing');
        return;
      }

      if (!formData.employeeId) {
        setError('Please select an employee');
        return;
      }

      if (!formData.payPeriod) {
        setError('Please enter pay period');
        return;
      }

      if (!formData.baseSalary) {
        setError('Please enter base salary');
        return;
      }

      const payrollData = {
        ...formData,
        organizationId: orgId,
        netSalary: calculateNetSalary(formData),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (selectedPayroll) {
        await payrollService.update(selectedPayroll.id, {
          ...payrollData,
          updatedAt: serverTimestamp()
        });
        toast.success('Payroll updated successfully!');
      } else {
        await payrollService.create(payrollData);
        toast.success('Payroll created successfully!');
      }

      await loadData();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedPayroll(null);
      resetForm();
    } catch (err) {
      setError('Failed to save payroll. Please try again.');
      console.error('Error saving payroll:', err);
    }
  };

  const handleDeletePayroll = async (id) => {
    if (window.confirm('Are you sure you want to delete this payroll record?')) {
      try {
        setError(null);
        await payrollService.delete(id);
        await loadData();
        toast.success('Payroll deleted successfully!');
      } catch (err) {
        setError('Failed to delete payroll. Please try again.');
        console.error('Error deleting payroll:', err);
      }
    }
  };

  const handleMarkAsPaid = async (payrollId) => {
    try {
      setError(null);
      const payroll = payrolls.find(p => p.id === payrollId);
      if (!payroll) return;

      await payrollService.update(payrollId, {
        status: 'paid',
        updatedAt: serverTimestamp()
      });
      
      await loadData();
      toast.success('Payroll marked as paid!');
    } catch (err) {
      setError('Failed to update payroll status. Please try again.');
      console.error('Error updating payroll:', err);
      toast.error('Failed to update payroll status.');
    }
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedPayrolls.length === 0) {
      toast.warning('Please select at least one payroll to mark as paid.');
      return;
    }

    if (!window.confirm(`Are you sure you want to mark ${selectedPayrolls.length} payroll(s) as paid?`)) {
      return;
    }

    try {
      setError(null);
      const updatePromises = selectedPayrolls.map(payrollId =>
        payrollService.update(payrollId, {
          status: 'paid',
          updatedAt: serverTimestamp()
        })
      );

      await Promise.all(updatePromises);
      await loadData();
      setSelectedPayrolls([]);
      toast.success(`${selectedPayrolls.length} payroll(s) marked as paid!`);
    } catch (err) {
      setError('Failed to update payroll status. Please try again.');
      console.error('Error updating payrolls:', err);
      toast.error('Failed to update payroll status.');
    }
  };

  const handleToggleSelectPayroll = (payrollId) => {
    setSelectedPayrolls(prev => 
      prev.includes(payrollId)
        ? prev.filter(id => id !== payrollId)
        : [...prev, payrollId]
    );
  };

  const handleSelectAllPending = () => {
    const pendingPayrolls = filteredPayrolls.filter(p => p.status === 'pending');
    if (selectedPayrolls.length === pendingPayrolls.length) {
      setSelectedPayrolls([]);
    } else {
      setSelectedPayrolls(pendingPayrolls.map(p => p.id));
    }
  };

  // Group pending payrolls by month
  const getPendingPayrollsByMonth = () => {
    const pending = filteredPayrolls.filter(p => p.status === 'pending');
    const grouped = {};

    pending.forEach(payroll => {
      const payPeriod = payroll.payPeriod || '';
      if (!payPeriod) return;

      // Format: YYYY-MM
      const [year, month] = payPeriod.split('-');
      if (!year || !month) return;

      const monthKey = `${year}-${month}`;
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          monthKey,
          monthName,
          payrolls: [],
          totalAmount: 0
        };
      }

      grouped[monthKey].payrolls.push(payroll);
      grouped[monthKey].totalAmount += calculateNetSalary(payroll);
    });

    // Sort by month (most recent first)
    return Object.values(grouped).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  };

  // Function to create payroll from a single payment (reused logic)
  const createPayrollFromPayment = async (payment, paymentId, orgId, teacherSalaryPercentage, existingPayrollsCache = null) => {
    try {
      if (!payment.status || payment.status !== 'completed') {
        return { success: false, reason: 'Payment not completed' };
      }

      // Get class IDs from payment
      const classIds = payment.classId 
        ? [payment.classId] 
        : (payment.classIds && payment.classIds.length > 0 ? payment.classIds : []);

      if (classIds.length === 0) {
        return { success: false, reason: 'No class IDs in payment' };
      }

      // Get all users to find teachers
      const allUsers = await usersService.getAll(1000, orgId, false).catch(() => []);
      const teachers = allUsers.filter(user => {
        const role = user.role ? user.role.toLowerCase() : '';
        return role === 'teacher' || role === 'instructor';
      });

      // Get courses to find teachers
      const allCourses = await coursesService.getAll(1000, orgId, false).catch(() => []);
      
      // Map to track teacher payments
      const teacherPayrollMap = new Map();

      // Process each class
      for (const classId of classIds) {
        const course = allCourses.find(c => c.id === classId || String(c.id) === String(classId));
        if (!course) continue;

        // Find teachers for this course
        const courseTeachers = [];

        // Check instructor name match
        if (course.instructor) {
          const teacherByName = teachers.find(t => t.name === course.instructor || (t.name && t.name.toLowerCase() === course.instructor.toLowerCase()));
          if (teacherByName) courseTeachers.push(teacherByName);
        }

        // Check createdBy
        if (course.createdBy) {
          const teacherById = teachers.find(t => t.id === course.createdBy || t.uid === course.createdBy || String(t.id) === String(course.createdBy) || String(t.uid) === String(course.createdBy));
          if (teacherById && !courseTeachers.find(t => (t.id === teacherById.id || t.uid === teacherById.uid))) {
            courseTeachers.push(teacherById);
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

        if (courseTeachers.length === 0) continue;

        // Calculate payment per teacher (if multiple teachers, split equally)
        const paymentAmount = parseFloat(payment.amount) || 0;
        const teacherSharePerClass = paymentAmount / courseTeachers.length;
        const teacherSalaryPerClass = teacherSharePerClass * (teacherSalaryPercentage / 100);

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

      if (teacherPayrollMap.size === 0) {
        return { success: false, reason: 'No teachers found for payment classes' };
      }

      // Create payroll entries for each teacher
      const payPeriod = payment.year && payment.month 
        ? `${payment.year}-${String(payment.month).padStart(2, '0')}`
        : null;
      
      if (!payPeriod) {
        return { success: false, reason: 'Payment missing month/year' };
      }

      const paymentAmount = parseFloat(payment.amount) || 0;

      // Get existing payrolls (use cache if provided, otherwise fetch)
      const existingPayrolls = existingPayrollsCache || await payrollService.getAll(1000, orgId, false).catch(() => []);

      const createdPayrolls = [];
      for (const [teacherId, payrollData] of teacherPayrollMap) {
        // Check if this specific payment is already linked to a payroll for this teacher
        const paymentAlreadyProcessed = existingPayrolls.some(p => 
          p.employeeId === teacherId && 
          p.payPeriod === payPeriod &&
          p.calculationType === 'automatic' &&
          (p.paymentId === paymentId || (p.paymentIds && Array.isArray(p.paymentIds) && p.paymentIds.includes(paymentId)))
        );

        if (paymentAlreadyProcessed) {
          // Skip if this payment is already processed for this teacher
          continue;
        }

        // Check if any payroll exists for this teacher and pay period (to aggregate)
        const existingPayrollForPeriod = existingPayrolls.find(p => 
          p.employeeId === teacherId && 
          p.payPeriod === payPeriod &&
          p.calculationType === 'automatic'
        );

        if (existingPayrollForPeriod) {
          // Update existing payroll by adding new payment amount
          const currentBaseSalary = parseFloat(existingPayrollForPeriod.baseSalary || 0);
          const newBaseSalary = currentBaseSalary + payrollData.baseSalary;
          const currentAllowances = parseFloat(existingPayrollForPeriod.allowances || 0);
          const currentBonus = parseFloat(existingPayrollForPeriod.bonus || 0);
          const currentDeductions = parseFloat(existingPayrollForPeriod.deductions || 0);
          const newNetSalary = newBaseSalary + currentAllowances + currentBonus - currentDeductions;

          const paymentIds = existingPayrollForPeriod.paymentIds || [];
          if (!paymentIds.includes(paymentId)) {
            paymentIds.push(paymentId);
          }

          await payrollService.update(existingPayrollForPeriod.id, {
            baseSalary: newBaseSalary.toFixed(2),
            netSalary: newNetSalary.toFixed(2),
            paymentIds: paymentIds,
            status: existingPayrollForPeriod.status || 'pending',
            notes: `${existingPayrollForPeriod.notes || ''}\nAdded: Payment ${payment.transactionId || paymentId} ($${paymentAmount.toFixed(2)}). Teacher receives ${teacherSalaryPercentage}% ($${payrollData.baseSalary.toFixed(2)}). Classes: ${payrollData.classes.map(c => c.className).join(', ')}.`,
            updatedAt: serverTimestamp()
          });
          createdPayrolls.push({ type: 'updated', payrollId: existingPayrollForPeriod.id, teacherId });
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
            paymentId: paymentId,
            paymentIds: [paymentId],
            notes: `Auto-created from payment ${payment.transactionId || paymentId} ($${paymentAmount.toFixed(2)}). Teacher receives ${teacherSalaryPercentage}% ($${payrollData.baseSalary.toFixed(2)}). Classes: ${payrollData.classes.map(c => c.className).join(', ')}.`,
            netSalary: payrollData.baseSalary.toFixed(2),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          const createdPayrollId = await payrollService.create(payrollEntry);
          createdPayrolls.push({ type: 'created', payrollId: createdPayrollId, teacherId });
        }
      }

      return { success: true, payrollsCreated: createdPayrolls.length, payrolls: createdPayrolls };
    } catch (err) {
      console.error('Error creating payroll from payment:', err);
      return { success: false, reason: err.message, error: err };
    }
  };

  // Function to scan all payments and generate payroll entries
  const scanAllPaymentsAndGeneratePayroll = async () => {
    if (!window.confirm('This will scan ALL existing payments and create payroll entries for teachers. This may take a while. Continue?')) {
      return;
    }

    try {
      setProcessingAllPayments(true);
      setError(null);
      const orgId = getOrganizationId();
      
      if (!orgId) {
        setError('Organization ID is missing');
        setProcessingAllPayments(false);
        return;
      }

      // Get organization settings
      const orgDoc = await getDocument('organizations', orgId).catch(() => null);
      if (!orgDoc) {
        setError('Organization settings not found');
        setProcessingAllPayments(false);
        return;
      }

      const teacherSalaryPercentage = orgDoc.teacherSalaryPercentage || 75;

      // Get all payments and existing payrolls
      console.log('📊 Fetching all payments and existing payrolls...');
      const [allPayments, existingPayrolls] = await Promise.all([
        paymentsService.getAll(10000, orgId, false).catch(() => []),
        payrollService.getAll(10000, orgId, false).catch(() => [])
      ]);
      console.log(`📋 Found ${allPayments.length} total payments`);
      console.log(`📋 Found ${existingPayrolls.length} existing payroll entries`);

      // Filter only completed payments with class information
      const eligiblePayments = allPayments.filter(p => {
        const hasStatus = p.status === 'completed';
        const hasClass = p.classId || (p.classIds && p.classIds.length > 0);
        const hasMonthYear = p.month && p.year;
        return hasStatus && hasClass && hasMonthYear;
      });

      console.log(`✅ Found ${eligiblePayments.length} eligible payments (completed with class info)`);

      // Group payments by month for processing
      const paymentsByMonth = {};
      eligiblePayments.forEach(payment => {
        const monthKey = `${payment.year}-${String(payment.month).padStart(2, '0')}`;
        if (!paymentsByMonth[monthKey]) {
          paymentsByMonth[monthKey] = [];
        }
        paymentsByMonth[monthKey].push(payment);
      });

      const months = Object.keys(paymentsByMonth).sort();
      console.log(`📅 Processing ${months.length} month(s):`, months);

      let totalProcessed = 0;
      let totalCreated = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      const errors = [];

      // Process each month
      for (const monthKey of months) {
        const [year, month] = monthKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
        setProcessingProgress({ current: totalProcessed, total: eligiblePayments.length, month: monthName });

        const monthPayments = paymentsByMonth[monthKey];
        console.log(`\n📅 Processing ${monthName}: ${monthPayments.length} payment(s)`);

        // Process each payment in this month
        for (const payment of monthPayments) {
          try {
            const paymentId = payment.id;
            const result = await createPayrollFromPayment(payment, paymentId, orgId, teacherSalaryPercentage, existingPayrolls);
            
            if (result.success) {
              totalCreated += result.payrolls.filter(p => p.type === 'created').length;
              totalUpdated += result.payrolls.filter(p => p.type === 'updated').length;
              console.log(`  ✓ Payment ${paymentId}: ${result.payrollsCreated} payroll(s) created/updated`);
            } else {
              totalSkipped++;
              console.log(`  ⏭️ Payment ${paymentId}: ${result.reason}`);
            }
            totalProcessed++;
            setProcessingProgress({ current: totalProcessed, total: eligiblePayments.length, month: monthName });
          } catch (err) {
            errors.push({ paymentId: payment.id, error: err.message });
            console.error(`  ❌ Error processing payment ${payment.id}:`, err);
            totalProcessed++;
          }
        }
      }

      // Reload data
      await loadData();

      setProcessingAllPayments(false);
      setProcessingProgress({ current: 0, total: 0, month: '' });

      // Show summary
      const summary = `Processed ${totalProcessed} payments:\n` +
        `✅ Created: ${totalCreated} new payroll entries\n` +
        `🔄 Updated: ${totalUpdated} existing payroll entries\n` +
        `⏭️ Skipped: ${totalSkipped} payments\n` +
        (errors.length > 0 ? `❌ Errors: ${errors.length}` : '');
      
      console.log('\n📊 Processing Summary:', summary);
      toast.success(`Payroll generation complete! Created ${totalCreated} new entries, updated ${totalUpdated} existing entries.`);
      
      if (errors.length > 0) {
        console.error('Errors encountered:', errors);
        toast.warning(`${errors.length} payment(s) had errors. Check console for details.`);
      }
    } catch (err) {
      setError('Failed to process payments. Please try again.');
      console.error('Error scanning payments:', err);
      setProcessingAllPayments(false);
      setProcessingProgress({ current: 0, total: 0, month: '' });
      toast.error('Failed to process all payments. Please check console for details.');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      payPeriod: '',
      baseSalary: '',
      allowances: '',
      deductions: '',
      bonus: '',
      status: 'pending',
      paymentMethod: 'bank_transfer',
      notes: '',
      calculationType: 'manual'
    });
  };

  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + calculateNetSalary(p), 0);
  const pendingPayrolls = filteredPayrolls.filter(p => p.status === 'pending').length;
  const paidPayrolls = filteredPayrolls.filter(p => p.status === 'paid').length;

  return (
    <div className="organization-payroll-container">
      <div className="organization-payroll-card">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* Header */}
        <div className="organization-payroll-header">
          <div className="header-content">
            <div className="header-icon-wrapper">
              <FaFileInvoiceDollar className="header-icon" />
            </div>
            <div>
              <h1 className="organization-payroll-title">Payroll Management</h1>
              <p className="organization-payroll-subtitle">Manage employee payroll and salaries</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="add-payroll-btn" 
              onClick={scanAllPaymentsAndGeneratePayroll}
              disabled={processingAllPayments}
              style={{ 
                background: processingAllPayments ? '#94a3b8' : '#10b981',
                opacity: processingAllPayments ? 0.7 : 1,
                cursor: processingAllPayments ? 'not-allowed' : 'pointer'
              }}
            >
              {processingAllPayments ? (
                <>
                  <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  <FaSync className="btn-icon" />
                  Generate Payroll from All Payments
                </>
              )}
            </button>
            <button className="add-payroll-btn" onClick={handleAddPayroll}>
              <FaPlus className="btn-icon" />
              Add Payroll
            </button>
          </div>
        </div>

        {/* Processing Progress */}
        {processingAllPayments && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            background: 'var(--bg-tertiary)', 
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <FaSpinner className="spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '1.25rem', color: 'var(--primary)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Processing Payments: {processingProgress.month}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {processingProgress.current} of {processingProgress.total} payments processed
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '4px', 
                  marginTop: '0.5rem',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${(processingProgress.current / Math.max(processingProgress.total, 1)) * 100}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, var(--primary), var(--primary-dark))',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="payroll-stats-grid">
          <div className="payroll-stat-card">
            <div className="stat-value">${totalPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="stat-label">Total Payroll</div>
          </div>
          <div className="payroll-stat-card">
            <div className="stat-value">{filteredPayrolls.length}</div>
            <div className="stat-label">Total Records</div>
          </div>
          <div className="payroll-stat-card">
            <div className="stat-value warning">{pendingPayrolls}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="payroll-stat-card">
            <div className="stat-value success">{paidPayrolls}</div>
            <div className="stat-label">Paid</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="payroll-tabs">
          <button
            className={`payroll-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('all');
              setSelectedPayrolls([]);
            }}
          >
            <FaFileInvoiceDollar />
            All Payrolls
          </button>
          <button
            className={`payroll-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pending');
              setSelectedPayrolls([]);
            }}
          >
            <FaSpinner />
            Pending Payments
            {pendingPayrolls > 0 && (
              <span className="tab-badge">{pendingPayrolls}</span>
            )}
          </button>
        </div>

        {/* Bulk Actions for Pending Tab */}
        {activeTab === 'pending' && filteredPayrolls.filter(p => p.status === 'pending').length > 0 && (
          <div className="bulk-actions-bar">
            <div className="bulk-actions-left">
              <label className="bulk-select-all">
                <input
                  type="checkbox"
                  checked={selectedPayrolls.length === filteredPayrolls.filter(p => p.status === 'pending').length && filteredPayrolls.filter(p => p.status === 'pending').length > 0}
                  onChange={handleSelectAllPending}
                />
                <span>Select All ({selectedPayrolls.length} selected)</span>
              </label>
            </div>
            {selectedPayrolls.length > 0 && (
              <button
                className="bulk-action-btn"
                onClick={handleBulkMarkAsPaid}
              >
                <FaCheckDouble />
                Mark {selectedPayrolls.length} as Paid
              </button>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="payroll-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by employee or pay period..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeTab === 'all' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select 
                className="filter-select"
                value={filterPayPeriod}
                onChange={(e) => setFilterPayPeriod(e.target.value)}
              >
                <option value="all">All Pay Periods</option>
                {uniquePayPeriods.map(period => (
                  <option key={period} value={period}>{period}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Payroll List */}
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Loading payroll data...</p>
          </div>
        ) : (
          <div className="payroll-list">
            {filteredPayrolls.length === 0 ? (
              <div className="empty-state">
                <FaFileInvoiceDollar className="empty-icon" />
                <p>No payroll records found</p>
              </div>
            ) : activeTab === 'pending' ? (
              // Grouped by month view for pending tab
              (() => {
                const groupedByMonth = getPendingPayrollsByMonth();
                return groupedByMonth.length === 0 ? (
                  <div className="empty-state">
                    <FaFileInvoiceDollar className="empty-icon" />
                    <p>No pending payroll records found</p>
                  </div>
                ) : (
                  groupedByMonth.map((monthGroup) => (
                    <div key={monthGroup.monthKey} className="payroll-month-group">
                      <div className="month-group-header">
                        <h3 className="month-group-title">
                          <FaCalendar />
                          {monthGroup.monthName}
                        </h3>
                        <div className="month-group-summary">
                          <span className="month-total-count">{monthGroup.payrolls.length} payroll{monthGroup.payrolls.length !== 1 ? 's' : ''}</span>
                          <span className="month-total-amount">Total: ${monthGroup.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="month-payrolls-list">
                        {monthGroup.payrolls.map((payroll) => {
                          const netSalary = calculateNetSalary(payroll);
                          const isSelected = selectedPayrolls.includes(payroll.id);
                          return (
                            <div key={payroll.id} className={`payroll-card ${isSelected ? 'selected' : ''}`}>
                              {activeTab === 'pending' && (
                                <div className="payroll-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectPayroll(payroll.id)}
                                  />
                                </div>
                              )}
                              <div className="payroll-card-content">
                                <div className="payroll-card-header">
                                  <div className="payroll-info">
                                    <h3 className="payroll-employee-name">{getEmployeeName(payroll.employeeId)}</h3>
                                    <div className="payroll-meta">
                                      <span className="payroll-period">
                                        <FaCalendar className="meta-icon" />
                                        {payroll.payPeriod || 'N/A'}
                                      </span>
                                      <span className={`payroll-status status-${payroll.status}`}>
                                        {payroll.status === 'paid' && <FaCheckCircle />}
                                        {payroll.status === 'pending' && <FaSpinner className="spinner-small" />}
                                        {payroll.status === 'cancelled' && <FaTimesCircle />}
                                        {payroll.status || 'pending'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="payroll-actions">
                                    {payroll.status === 'pending' && (
                                      <button 
                                        className="action-btn approve-btn"
                                        title="Mark as Paid"
                                        onClick={() => handleMarkAsPaid(payroll.id)}
                                        style={{ 
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '0.5rem',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        <FaCheckCircle style={{ flexShrink: 0 }} />
                                        <span>Mark as Paid</span>
                                      </button>
                                    )}
                                    <button 
                                      className="action-btn edit-btn"
                                      title="Edit"
                                      onClick={() => handleEditPayroll(payroll)}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button 
                                      className="action-btn delete-btn"
                                      title="Delete"
                                      onClick={() => handleDeletePayroll(payroll.id)}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                                <div className="payroll-card-body">
                                  <div className="payroll-details-grid">
                                    <div className="payroll-detail-item">
                                      <span className="detail-label">Base Salary:</span>
                                      <span className="detail-value">${(parseFloat(payroll.baseSalary) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="payroll-detail-item">
                                      <span className="detail-label">Allowances:</span>
                                      <span className="detail-value positive">+${(parseFloat(payroll.allowances) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="payroll-detail-item">
                                      <span className="detail-label">Bonus:</span>
                                      <span className="detail-value positive">+${(parseFloat(payroll.bonus) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="payroll-detail-item">
                                      <span className="detail-label">Deductions:</span>
                                      <span className="detail-value negative">-${(parseFloat(payroll.deductions) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="payroll-detail-item net-salary">
                                      <span className="detail-label">Net Salary:</span>
                                      <span className="detail-value net">${netSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="payroll-detail-item">
                                      <span className="detail-label">Payment Method:</span>
                                      <span className="detail-value">{payroll.paymentMethod || 'N/A'}</span>
                                    </div>
                                  </div>
                                  {payroll.notes && (
                                    <div className="payroll-notes">
                                      <strong>Notes:</strong> {payroll.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                );
              })()
            ) : (
              // Regular list view for all tab
              filteredPayrolls.map((payroll) => {
                const netSalary = calculateNetSalary(payroll);
                return (
                  <div key={payroll.id} className="payroll-card">
                    <div className="payroll-card-header">
                      <div className="payroll-info">
                        <h3 className="payroll-employee-name">{getEmployeeName(payroll.employeeId)}</h3>
                        <div className="payroll-meta">
                          <span className="payroll-period">
                            <FaCalendar className="meta-icon" />
                            {payroll.payPeriod || 'N/A'}
                          </span>
                          <span className={`payroll-status status-${payroll.status}`}>
                            {payroll.status === 'paid' && <FaCheckCircle />}
                            {payroll.status === 'pending' && <FaSpinner className="spinner-small" />}
                            {payroll.status === 'cancelled' && <FaTimesCircle />}
                            {payroll.status || 'pending'}
                          </span>
                        </div>
                      </div>
                      <div className="payroll-actions">
                        <button 
                          className="action-btn edit-btn"
                          title="Edit"
                          onClick={() => handleEditPayroll(payroll)}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          title="Delete"
                          onClick={() => handleDeletePayroll(payroll.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <div className="payroll-card-body">
                      <div className="payroll-details-grid">
                        <div className="payroll-detail-item">
                          <span className="detail-label">Base Salary:</span>
                          <span className="detail-value">${(parseFloat(payroll.baseSalary) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="payroll-detail-item">
                          <span className="detail-label">Allowances:</span>
                          <span className="detail-value positive">+${(parseFloat(payroll.allowances) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="payroll-detail-item">
                          <span className="detail-label">Bonus:</span>
                          <span className="detail-value positive">+${(parseFloat(payroll.bonus) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="payroll-detail-item">
                          <span className="detail-label">Deductions:</span>
                          <span className="detail-value negative">-${(parseFloat(payroll.deductions) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="payroll-detail-item net-salary">
                          <span className="detail-label">Net Salary:</span>
                          <span className="detail-value net">${netSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="payroll-detail-item">
                          <span className="detail-label">Payment Method:</span>
                          <span className="detail-value">{payroll.paymentMethod || 'N/A'}</span>
                        </div>
                      </div>
                      {payroll.notes && (
                        <div className="payroll-notes">
                          <strong>Notes:</strong> {payroll.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add Payroll Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Payroll</h2>
              <button className="modal-close" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Employee *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    const employee = employees.find(emp => emp.id === e.target.value);
                    setFormData({
                      ...formData,
                      employeeId: e.target.value,
                      employeeName: employee ? (employee.name || employee.email) : ''
                    });
                  }}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name || employee.email} ({employee.role || 'employee'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Pay Period * (YYYY-MM)</label>
                <input
                  type="text"
                  value={formData.payPeriod}
                  onChange={(e) => setFormData({...formData, payPeriod: e.target.value})}
                  placeholder="2025-01"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Base Salary *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({...formData, baseSalary: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Allowances</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.allowances}
                    onChange={(e) => setFormData({...formData, allowances: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bonus</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Deductions</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>
              {formData.baseSalary && (
                <div className="net-salary-preview">
                  <strong>Net Salary: ${calculateNetSalary(formData).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitPayroll}>Add Payroll</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payroll Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Payroll</h2>
              <button className="modal-close" onClick={() => {
                setShowEditModal(false);
                setSelectedPayroll(null);
                resetForm();
              }}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Employee</label>
                <input
                  type="text"
                  value={formData.employeeName}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Pay Period * (YYYY-MM)</label>
                <input
                  type="text"
                  value={formData.payPeriod}
                  onChange={(e) => setFormData({...formData, payPeriod: e.target.value})}
                  placeholder="2025-01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Calculation Type</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={formData.calculationType || 'manual'}
                    onChange={(e) => setFormData({...formData, calculationType: e.target.value})}
                    style={{ flex: 1 }}
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="automatic">Automatic (from Student Payments)</option>
                  </select>
                  {formData.calculationType === 'automatic' && formData.employeeId && formData.payPeriod && (
                    <button
                      type="button"
                      className="auto-calc-btn"
                      onClick={handleAutoCalculate}
                      disabled={calculating}
                    >
                      {calculating ? (
                        <>
                          <FaSpinner className="spinner" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <FaCalculator />
                          Calculate
                        </>
                      )}
                    </button>
                  )}
                </div>
                {formData.calculationType === 'automatic' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p className="form-description" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Automatically calculate salary from student payments for this teacher's courses. 
                      Current split: <strong>{organizationSettings.teacherSalaryPercentage}%</strong> teacher, <strong>{organizationSettings.organizationSalaryPercentage}%</strong> organization.
                    </p>
                    <Link 
                      to="/organization/settings" 
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        fontSize: '0.875rem', 
                        color: 'var(--primary)', 
                        textDecoration: 'none',
                        fontWeight: 500
                      }}
                    >
                      <FaCog style={{ fontSize: '0.75rem' }} />
                      Change percentage in Settings
                    </Link>
                  </div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Base Salary *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({...formData, baseSalary: e.target.value})}
                    placeholder="0.00"
                    required
                    disabled={formData.calculationType === 'automatic' && !formData.baseSalary}
                  />
                </div>
                <div className="form-group">
                  <label>Allowances</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.allowances}
                    onChange={(e) => setFormData({...formData, allowances: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bonus</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Deductions</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deductions}
                    onChange={(e) => setFormData({...formData, deductions: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows="3"
                />
              </div>
              {formData.baseSalary && (
                <div className="net-salary-preview">
                  <strong>Net Salary: ${calculateNetSalary(formData).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowEditModal(false);
                setSelectedPayroll(null);
                resetForm();
              }}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitPayroll}>Update Payroll</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Calculate Modal */}
      {showAutoCalcModal && autoCalcData && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Auto-Calculate Salary</h2>
              <button className="modal-close" onClick={() => {
                setShowAutoCalcModal(false);
                setAutoCalcData(null);
              }}>×</button>
            </div>
            <div className="modal-body">
              <div className="auto-calc-summary">
                <div className="summary-card">
                  <div className="summary-label">Total Student Payments</div>
                  <div className="summary-value">${autoCalcData.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="summary-detail">{autoCalcData.paymentCount} payment(s)</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Teacher Salary ({organizationSettings.teacherSalaryPercentage}%)</div>
                  <div className="summary-value primary">${autoCalcData.teacherSalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Organization Share ({organizationSettings.organizationSalaryPercentage}%)</div>
                  <div className="summary-value secondary">${autoCalcData.organizationShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <Link 
                  to="/organization/settings" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    color: 'var(--primary)', 
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  <FaCog style={{ fontSize: '0.75rem' }} />
                  Change percentage split in Settings
                </Link>
              </div>

              {autoCalcData.courseBreakdown && autoCalcData.courseBreakdown.length > 0 && (
                <div className="course-breakdown-section">
                  <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Breakdown by Course</h3>
                  <div className="course-breakdown-list">
                    {autoCalcData.courseBreakdown.map((course, idx) => (
                      <div key={idx} className="course-breakdown-item">
                        <div className="course-name">{course.courseName}</div>
                        <div className="course-details">
                          <span>{course.paymentCount} payment(s)</span>
                          <span>Total: ${course.totalPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="teacher-share">Teacher: ${course.teacherShare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {autoCalcData.totalPayments === 0 && (
                <div className="no-payments-message">
                  <p>No student payments found for this teacher's courses in the selected pay period.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowAutoCalcModal(false);
                setAutoCalcData(null);
              }}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleApplyAutoCalculation}
                disabled={autoCalcData.totalPayments === 0}
              >
                Apply Calculation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationPayroll;
