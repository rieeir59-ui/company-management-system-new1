
export type Employee = {
  uid: string; // This will now store the Firebase Auth UID
  name: string;
  contact: string;
  email: string;
  record: string;
  avatarId: string;
  department: string;
  password?: string;
};

export const employees: Employee[] = [
  { uid: 'user1', name: 'Isbah Hassan', contact: '0300-8448333', email: 'isbah.hassan@ri-hub.com', record: 'EMP-001', avatarId: 'avatar-1', department: 'ceo', password: 'password' },
  { uid: 'user2', name: 'Sobia', contact: '0308-4448470', email: 'sobia@ri-hub.com', record: 'EMP-002', avatarId: 'avatar-3', department: 'admin', password: 'password' },
  { uid: 'user3', name: 'Fiza', contact: '0306-5081954', email: 'fiza@ri-hub.com', record: 'EMP-003', avatarId: 'avatar-1', department: 'hr', password: 'password' },
  { uid: 'user4', name: 'Rabiya Eman', contact: '0302-2774442', email: 'rabiya.eman@ri-hub.com', record: 'EMP-004', avatarId: 'avatar-1', department: 'software-engineer', password: 'password' },
  { uid: 'user5', name: 'Imran Abbas', contact: '0325-5382699', email: 'imran.abbas@ri-hub.com', record: 'EMP-005', avatarId: 'avatar-2', department: 'software-engineer', password: 'password' },
  { uid: 'user6', name: 'Waqas Rasool', contact: '0321-5564674', email: 'waqas.rasool@ri-hub.com', record: 'EMP-006', avatarId: 'avatar-2', department: 'finance', password: 'password' },
  { uid: 'user7', name: 'Mujahid', contact: '0300-4741406', email: 'mujahid@ri-hub.com', record: 'EMP-007', avatarId: 'avatar-2', department: 'draftman', password: 'password' },
  { uid: 'user8', name: 'Jabbar', contact: '0333-4624328', email: 'jabbar@ri-hub.com', record: 'EMP-008', avatarId: 'avatar-2', department: 'draftman', password: 'password' },
  { uid: 'user9', name: 'Mohsin', contact: '0321-8846995', email: 'mohsin@ri-hub.com', record: 'EMP-009', avatarId: 'avatar-2', department: '3d-visualizer', password: 'password' },
  { uid: 'user10', name: 'Haseeb', contact: '0321-9400570', email: 'haseeb@ri-hub.com', record: 'EMP-010', avatarId: 'avatar-2', department: 'architects', password: 'password' },
  { uid: 'user11', name: 'Luqman', contact: '0321-1111261', email: 'luqman@ri-hub.com', record: 'EMP-011', avatarId: 'avatar-2', department: 'architects', password: 'password' },
  { uid: 'user12', name: 'Asad', contact: '0321-4333215', email: 'asad@ri-hub.com', record: 'EMP-012', avatarId: 'avatar-2', department: 'architects', password: 'password' },
  { uid: 'user13', name: 'Waleed', contact: '0332-0424458', email: 'waleed@ri-hub.com', record: 'EMP-013', avatarId: 'avatar-2', department: 'architects', password: 'password' },
  { uid: 'user14', name: 'Kizzar', contact: '0313-9592679', email: 'kizzar@ri-hub.com', record: 'EMP-014', avatarId: 'avatar-2', department: 'architects', password: 'password' },
  { uid: 'user15', name: 'Waqas', contact: '0321-8404780', email: 'waqas@ri-hub.com', record: 'EMP-015', avatarId: 'avatar-2', department: 'draftman', password: 'password' },
  { uid: 'user16', name: 'Noman', contact: '0302-8499301', email: 'noman@ri-hub.com', record: 'EMP-016', avatarId: 'avatar-2', department: 'quantity-management', password: 'password' },
];

export const employeesByDepartment = employees.reduce((acc, employee) => {
  const { department } = employee;
  if (!acc[department]) {
    acc[department] = [];
  }
  acc[department].push(employee);
  return acc;
}, {} as Record<string, Employee[]>);
