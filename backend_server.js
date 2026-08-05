const http = require('http');
const url = require('url');

const PORT = 8000;

// Seed Data
let departments = [
  { id: "d1", name: "Engineering", code: "ENG", description: "Software & System Architecture", created_at: new Date().toISOString(), employee_count: 3 },
  { id: "d2", name: "Human Resources", code: "HR", description: "Talent Acquisition & Employee Well-being", created_at: new Date().toISOString(), employee_count: 1 },
  { id: "d3", name: "Product & Design", code: "PRD", description: "Product Management & UI/UX Design", created_at: new Date().toISOString(), employee_count: 1 },
  { id: "d4", name: "Marketing & Growth", code: "MKT", description: "Brand, Campaigns & Strategic Outreach", created_at: new Date().toISOString(), employee_count: 0 },
  { id: "d5", name: "Finance & Operations", code: "FIN", description: "Accounting, Payroll & Operational Excellence", created_at: new Date().toISOString(), employee_count: 0 },
];

let employees = [
  {
    id: "e1",
    first_name: "Sahil",
    last_name: "Gupta",
    email: "admin@example.com",
    phone: "+1 (555) 019-2834",
    designation: "Head of Engineering",
    salary: 150000,
    joining_date: "2023-01-15",
    status: "Active",
    department_id: "d1",
    department_name: "Engineering",
    manager_name: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e2",
    first_name: "Sarah",
    last_name: "Jenkins",
    email: "hr@example.com",
    phone: "+1 (555) 012-3456",
    designation: "HR Director",
    salary: 115000,
    joining_date: "2023-03-01",
    status: "Active",
    department_id: "d2",
    department_name: "Human Resources",
    manager_name: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e3",
    first_name: "Alex",
    last_name: "Morgan",
    email: "manager@example.com",
    phone: "+1 (555) 014-9821",
    designation: "Engineering Manager",
    salary: 135000,
    joining_date: "2023-05-10",
    status: "Active",
    department_id: "d1",
    department_name: "Engineering",
    manager_name: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e4",
    first_name: "David",
    last_name: "Chen",
    email: "david.chen@example.com",
    phone: "+1 (555) 018-7733",
    designation: "Senior Full-Stack Developer",
    salary: 110000,
    joining_date: "2023-08-20",
    status: "Active",
    department_id: "d1",
    department_name: "Engineering",
    manager_name: "Alex Morgan",
    created_at: new Date().toISOString()
  },
  {
    id: "e5",
    first_name: "Elena",
    last_name: "Rostova",
    email: "elena.r@example.com",
    phone: "+1 (555) 016-5544",
    designation: "Lead UI/UX Designer",
    salary: 105000,
    joining_date: "2024-02-01",
    status: "Active",
    department_id: "d3",
    department_name: "Product & Design",
    manager_name: null,
    created_at: new Date().toISOString()
  }
];

const todayStr = new Date().toISOString().split('T')[0];

let attendances = [
  {
    id: "a1",
    employee_id: "e1",
    employee_name: "Sahil Gupta",
    department_name: "Engineering",
    date: todayStr,
    check_in: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    check_out: null,
    status: "Checked In",
    created_at: new Date().toISOString()
  },
  {
    id: "a2",
    employee_id: "e4",
    employee_name: "David Chen",
    department_name: "Engineering",
    date: todayStr,
    check_in: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    check_out: null,
    status: "Checked In",
    created_at: new Date().toISOString()
  }
];

let leaves = [
  {
    id: "l1",
    employee_id: "e4",
    employee_name: "David Chen",
    department_name: "Engineering",
    leave_type: "Annual",
    reason: "Family vacation to Grand Canyon",
    start_date: "2026-08-10",
    end_date: "2026-08-14",
    total_days: 5,
    status: "Pending",
    created_at: new Date().toISOString()
  },
  {
    id: "l2",
    employee_id: "e5",
    employee_name: "Elena Rostova",
    department_name: "Product & Design",
    leave_type: "Sick",
    reason: "Medical checkup & recovery",
    start_date: "2026-08-01",
    end_date: "2026-08-02",
    total_days: 2,
    status: "Approved",
    reviewed_by_name: "System Administrator",
    comments: "Approved. Take care!",
    created_at: new Date().toISOString()
  }
];

let currentUser = {
  id: "u1",
  email: "admin@example.com",
  is_active: true,
  is_superuser: true,
  full_name: "Sahil Gupta",
  role: "ADMIN",
  employee_id: "e1"
};

const sendJSON = (res, statusCode, data) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
};

const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
};

const parseFormBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const result = {};
      for (const [key, value] of params.entries()) {
        result[key] = value;
      }
      resolve(result);
    });
  });
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`[API Request] ${method} ${pathname}`);

  // 1. Auth Login & Access Token
  if (pathname === '/api/v1/login/access-token' && method === 'POST') {
    const body = await parseFormBody(req);
    const email = body.username || "admin@example.com";
    if (email === "hr@example.com") {
      currentUser = { id: "u2", email: "hr@example.com", is_active: true, is_superuser: false, full_name: "Sarah Jenkins", role: "HR", employee_id: "e2" };
    } else if (email === "manager@example.com") {
      currentUser = { id: "u3", email: "manager@example.com", is_active: true, is_superuser: false, full_name: "Alex Morgan", role: "MANAGER", employee_id: "e3" };
    } else if (email === "david.chen@example.com") {
      currentUser = { id: "u4", email: "david.chen@example.com", is_active: true, is_superuser: false, full_name: "David Chen", role: "EMPLOYEE", employee_id: "e4" };
    } else {
      currentUser = { id: "u1", email: email, is_active: true, is_superuser: true, full_name: "Sahil Gupta", role: "ADMIN", employee_id: "e1" };
    }
    return sendJSON(res, 200, { access_token: "mock-jwt-token-12345", token_type: "bearer" });
  }

  // 2. Current User Me
  if (pathname === '/api/v1/users/me' && method === 'GET') {
    return sendJSON(res, 200, currentUser);
  }

  // 3. Signup / Register User
  if ((pathname === '/api/v1/users/signup' || pathname === '/api/v1/users/open') && method === 'POST') {
    const body = await parseBody(req);
    currentUser = {
      id: "u-" + Date.now(),
      email: body.email || "user@example.com",
      is_active: true,
      is_superuser: false,
      full_name: body.full_name || "New User",
      role: "EMPLOYEE",
      employee_id: null
    };
    return sendJSON(res, 200, currentUser);
  }

  // 4. Dashboard Stats
  if (pathname === '/api/v1/dashboard/stats' && method === 'GET') {
    const totalEmp = employees.length;
    const activeEmp = employees.filter(e => e.status === "Active").length;
    const deptCounts = departments.map(d => ({
      name: d.name,
      code: d.code,
      count: employees.filter(e => e.department_id === d.id).length
    }));
    const presentToday = attendances.filter(a => a.date === todayStr && (a.status === "Present" || a.status === "Checked In" || a.status === "Late")).length;
    const attRate = activeEmp > 0 ? Math.round((presentToday / activeEmp) * 100) : 0;
    const pendingL = leaves.filter(l => l.status === "Pending").length;

    return sendJSON(res, 200, {
      total_employees: totalEmp,
      active_employees: activeEmp,
      total_departments: departments.length,
      present_today: presentToday,
      attendance_rate: attRate,
      pending_leaves: pendingL,
      department_counts: deptCounts,
      recent_leaves: leaves.slice(0, 5),
      recent_attendances: attendances.slice(0, 5)
    });
  }

  // 5. Departments API
  if (pathname === '/api/v1/departments/' || pathname === '/api/v1/departments') {
    if (method === 'GET') {
      const data = departments.map(d => ({
        ...d,
        employee_count: employees.filter(e => e.department_id === d.id).length
      }));
      return sendJSON(res, 200, { data, count: data.length });
    }
    if (method === 'POST') {
      const body = await parseBody(req);
      const newDept = {
        id: "d-" + Date.now(),
        name: body.name,
        code: body.code,
        description: body.description || "",
        created_at: new Date().toISOString(),
        employee_count: 0
      };
      departments.push(newDept);
      return sendJSON(res, 200, newDept);
    }
  }

  if (pathname.startsWith('/api/v1/departments/')) {
    const id = pathname.split('/')[4];
    if (method === 'PUT') {
      const body = await parseBody(req);
      const dept = departments.find(d => d.id === id);
      if (dept) {
        if (body.name) dept.name = body.name;
        if (body.code) dept.code = body.code;
        if (body.description !== undefined) dept.description = body.description;
        return sendJSON(res, 200, dept);
      }
    }
    if (method === 'DELETE') {
      departments = departments.filter(d => d.id !== id);
      employees.forEach(e => { if (e.department_id === id) { e.department_id = null; e.department_name = null; } });
      return sendJSON(res, 200, { message: "Department deleted successfully" });
    }
  }

  // 6. Employees API
  if (pathname === '/api/v1/employees/' || pathname === '/api/v1/employees') {
    if (method === 'GET') {
      let filtered = [...employees];
      const q = parsedUrl.query.q;
      const deptId = parsedUrl.query.department_id;
      const status = parsedUrl.query.status;

      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(e =>
          e.first_name.toLowerCase().includes(query) ||
          e.last_name.toLowerCase().includes(query) ||
          e.email.toLowerCase().includes(query) ||
          e.designation.toLowerCase().includes(query)
        );
      }
      if (deptId) {
        filtered = filtered.filter(e => e.department_id === deptId);
      }
      if (status) {
        filtered = filtered.filter(e => e.status === status);
      }
      return sendJSON(res, 200, { data: filtered, count: filtered.length });
    }
    if (method === 'POST') {
      const body = await parseBody(req);
      const dept = departments.find(d => d.id === body.department_id);
      const newEmp = {
        id: "e-" + Date.now(),
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        phone: body.phone || "",
        designation: body.designation,
        salary: body.salary || 85000,
        joining_date: body.joining_date || new Date().toISOString().split('T')[0],
        status: body.status || "Active",
        department_id: body.department_id || null,
        department_name: dept ? dept.name : null,
        manager_name: null,
        created_at: new Date().toISOString()
      };
      employees.unshift(newEmp);
      return sendJSON(res, 200, newEmp);
    }
  }

  if (pathname.startsWith('/api/v1/employees/')) {
    const id = pathname.split('/')[4];
    if (method === 'PUT') {
      const body = await parseBody(req);
      const emp = employees.find(e => e.id === id);
      if (emp) {
        Object.assign(emp, body);
        if (body.department_id) {
          const dept = departments.find(d => d.id === body.department_id);
          if (dept) emp.department_name = dept.name;
        }
        return sendJSON(res, 200, emp);
      }
    }
    if (method === 'DELETE') {
      employees = employees.filter(e => e.id !== id);
      return sendJSON(res, 200, { message: "Employee deleted successfully" });
    }
  }

  // 7. Attendance API
  if (pathname === '/api/v1/attendance/check-in' && method === 'POST') {
    const emp = employees.find(e => e.id === currentUser.employee_id) || employees[0];
    let att = attendances.find(a => a.employee_id === emp.id && a.date === todayStr);
    if (!att) {
      att = {
        id: "a-" + Date.now(),
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        department_name: emp.department_name,
        date: todayStr,
        check_in: new Date().toISOString(),
        check_out: null,
        status: "Checked In",
        created_at: new Date().toISOString()
      };
      attendances.unshift(att);
    } else {
      att.check_in = new Date().toISOString();
      att.status = "Checked In";
    }
    return sendJSON(res, 200, att);
  }

  if (pathname === '/api/v1/attendance/check-out' && method === 'POST') {
    const emp = employees.find(e => e.id === currentUser.employee_id) || employees[0];
    let att = attendances.find(a => a.employee_id === emp.id && a.date === todayStr);
    if (att) {
      att.check_out = new Date().toISOString();
      att.status = "Present";
      return sendJSON(res, 200, att);
    }
    return sendJSON(res, 400, { detail: "Must check-in before checking out" });
  }

  if (pathname === '/api/v1/attendance/today' && method === 'GET') {
    const emp = employees.find(e => e.id === currentUser.employee_id) || employees[0];
    const att = attendances.find(a => a.employee_id === emp.id && a.date === todayStr);
    return sendJSON(res, 200, att || null);
  }

  if (pathname === '/api/v1/attendance/' || pathname === '/api/v1/attendance') {
    if (method === 'GET') {
      let filtered = [...attendances];
      const targetDate = parsedUrl.query.target_date;
      const status = parsedUrl.query.status;
      if (targetDate) filtered = filtered.filter(a => a.date === targetDate);
      if (status) filtered = filtered.filter(a => a.status === status);
      return sendJSON(res, 200, { data: filtered, count: filtered.length });
    }
  }

  // 8. Leave API
  if (pathname === '/api/v1/leave/my-leaves' && method === 'GET') {
    const emp = employees.find(e => e.id === currentUser.employee_id) || employees[0];
    const myL = leaves.filter(l => l.employee_id === emp.id);
    return sendJSON(res, 200, { data: myL, count: myL.length });
  }

  if (pathname === '/api/v1/leave/' || pathname === '/api/v1/leave') {
    if (method === 'GET') {
      return sendJSON(res, 200, { data: leaves, count: leaves.length });
    }
    if (method === 'POST') {
      const body = await parseBody(req);
      const emp = employees.find(e => e.id === currentUser.employee_id) || employees[0];
      const start = new Date(body.start_date);
      const end = new Date(body.end_date);
      const days = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)) + 1);

      const newLeave = {
        id: "l-" + Date.now(),
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        department_name: emp.department_name,
        leave_type: body.leave_type,
        reason: body.reason,
        start_date: body.start_date,
        end_date: body.end_date,
        total_days: days,
        status: "Pending",
        created_at: new Date().toISOString()
      };
      leaves.unshift(newLeave);
      return sendJSON(res, 200, newLeave);
    }
  }

  if (pathname.includes('/api/v1/leave/') && pathname.endsWith('/status')) {
    const parts = pathname.split('/');
    const id = parts[4];
    if (method === 'PUT') {
      const body = await parseBody(req);
      const leave = leaves.find(l => l.id === id);
      if (leave) {
        leave.status = body.status;
        leave.comments = body.comments;
        leave.reviewed_by_name = currentUser.full_name || currentUser.email;
        return sendJSON(res, 200, leave);
      }
    }
  }

  // Fallback 404
  return sendJSON(res, 404, { detail: "Not Found" });
});

server.listen(PORT, () => {
  console.log(`EMS Backend API Server listening on http://localhost:${PORT}`);
});
