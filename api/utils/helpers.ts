import bcrypt from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateTicketNumber = (): string => {
  const prefix = 'SHC';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const calculateSLADeadline = (priority: string, createdAt: Date = new Date()): Date => {
  const deadline = new Date(createdAt);
  
  switch (priority) {
    case 'critical':
      deadline.setMinutes(deadline.getMinutes() + 30); // 30 minutes
      break;
    case 'urgent':
      deadline.setHours(deadline.getHours() + 2); // 2 hours
      break;
    case 'normal':
    default:
      deadline.setHours(deadline.getHours() + 8); // 8 hours
      break;
  }
  
  return deadline;
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10,13}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[\w._%+-]+@shalimarcorp\.in$/;
  return emailRegex.test(email);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};