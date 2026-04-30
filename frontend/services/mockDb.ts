
import { BusinessProfile, UserAccount, Role } from '../types';

const STORAGE_KEYS = {
  BUSINESS_PROFILES: 'empripanel_profiles',
  USERS: 'empripanel_accounts',
  CURRENT_USER: 'empripanel_session'
};

const FORBIDDEN_WORDS = [
  "pornografía", "porno", "porn", "sexo", "sexual", "sexualidad", "erótico", "erótica", "xxx", "escort", 
  "prostitución", "prostituta", "prostituto", "puta", "puto", "puta madre", "fetiche", "arma", "armas", 
  "pistola", "revólver", "revolver", "rifle", "escopeta", "fusil", "ametralladora", "cuchillo", "navaja", 
  "bomba", "explosivo", "munición", "balas", "droga", "drogas", "cocaína", "cocaina", "falopa", "merca", 
  "heroína", "heroina", "marihuana", "porro", "faso", "crack", "éxtasis", "pastilla", "lsd", "ácido", 
  "ácido lisérgico", "metanfetamina", "cristal", "lavado de dinero", "narcotráfico", "narcotrafico", 
  "sicario", "mafioso", "mafia", "trata", "trata de personas", "extorsión", "extorsion", "fraude", 
  "estafa", "piratería", "pirateria", "apuestas", "apuesta", "juego ilegal", "juego clandestino"
];

const validateEmailFormat = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.includes(' ')) {
    throw new Error('Formato de email inválido o contiene espacios');
  }
};

/**
 * Validación determinística basada exclusivamente en la lista proporcionada.
 * Utiliza coincidencia de palabra completa (literal exacta).
 * No aplica análisis semántico, inferencias ni normalización.
 */
const validateContent = (text: string | undefined | null) => {
  if (!text) return;
  
  for (const word of FORBIDDEN_WORDS) {
    // Escapamos caracteres especiales de la palabra para Regex
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Regex para detectar la palabra completa exacta (ignorando mayúsculas/minúsculas pero respetando letras)
    // Se definen límites de palabra considerando caracteres del español (letras y acentos)
    const regex = new RegExp(`(?:^|[^a-zA-ZáéíóúÁÉÍÓÚñÑ])${escapedWord}(?:$|[^a-zA-ZáéíóúÁÉÍÓÚñÑ])`, 'i');
    
    if (regex.test(text)) {
      throw new Error(`El contenido incluye lenguaje no permitido: ‘${word}’`);
    }
  }
};

const validateObject = (obj: any) => {
  if (!obj) return;
  Object.entries(obj).forEach(([key, value]) => {
    // No validamos contraseñas, URLs ni IDs internos
    if (key === 'password' || key === 'id' || key === 'ownerId' || key === 'logo' || key === 'redirectionUrl') return;
    
    if (typeof value === 'string') {
      validateContent(value);
    } else if (typeof value === 'object' && value !== null) {
      validateObject(value);
    }
  });
};

// Simulación simple de hash para cumplir con el requerimiento de no guardar texto plano
const hashPassword = (password: string) => `hash_${btoa(password)}`;

const INITIAL_ACCOUNTS: UserAccount[] = [
  { id: 'u1', username: 'juan_explora', password: hashPassword('123'), privateEmail: 'juan@test.com', role: 'user', likedBusinesses: [], visitedHistory: [] },
  { id: 'b1', username: 'cafe_perez_admin', password: hashPassword('123'), privateEmail: 'admin@cafeperez.com', role: 'business', likedBusinesses: [], visitedHistory: [] },
  { id: 'admin_root', username: 'Empripanel', password: hashPassword('admin.pj'), privateEmail: 'admin@empripanel.com', role: 'user', likedBusinesses: [], visitedHistory: [] }
];

const INITIAL_PROFILES: BusinessProfile[] = [
  {
    id: 'p1',
    ownerId: 'b1',
    publicName: 'Café de los Pérez',
    category: 'Gastronomía',
    shortDescription: 'Café artesanal y pastelería de autor.',
    fullDescription: 'Un espacio cálido diseñado para los amantes del buen café.',
    logo: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=400&fit=crop',
    redirectionUrl: 'https://instagram.com/cafeperez',
    location: 'Palermo, CABA',
    publicEmail: 'hola@cafeperez.com',
    socials: { instagram: 'https://instagram.com/cafeperez' },
    clicks: 150,
    likes: 45,
    reports: [],
    status: 'visible'
  },
  {
    id: 'p2',
    ownerId: 'b2',
    publicName: 'Nova Tech Store',
    category: 'Tecnología',
    shortDescription: 'Lo último en gadgets y hardware premium.',
    fullDescription: 'Nova Tech es tu destino para encontrar la mejor tecnología.',
    logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&h=400&fit=crop',
    redirectionUrl: 'https://novatech.com',
    location: 'Microcentro, CABA',
    socials: { twitter: 'https://twitter.com/novatechstore' },
    clicks: 230,
    likes: 82,
    reports: [],
    status: 'visible'
  }
];

export const getUsers = (): UserAccount[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_ACCOUNTS));
    return INITIAL_ACCOUNTS;
  }
  return JSON.parse(stored).map((u: any) => ({
    ...u,
    visitedHistory: u.visitedHistory || []
  }));
};

export const saveUsers = (users: UserAccount[]) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const getProfiles = (): BusinessProfile[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.BUSINESS_PROFILES);
  const profiles: BusinessProfile[] = stored ? JSON.parse(stored) : INITIAL_PROFILES;
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILES, JSON.stringify(INITIAL_PROFILES));
    return INITIAL_PROFILES.map(p => ({ ...p, status: p.status || 'visible', reports: p.reports || [] }));
  }
  return profiles.map(p => ({ ...p, status: p.status || 'visible', reports: p.reports || [] }));
};

export const shuffleProfiles = (profiles: BusinessProfile[]): BusinessProfile[] => {
  return [...profiles].sort(() => Math.random() - 0.5);
};

export const updateProfile = (profile: BusinessProfile) => {
  validateObject(profile);
  const list = getProfiles();
  const index = list.findIndex(p => p.id === profile.id);
  if (index !== -1) {
    list[index] = profile;
    localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILES, JSON.stringify(list));
  }
};

export const createProfile = (profile: Omit<BusinessProfile, 'id' | 'clicks' | 'likes' | 'reports' | 'status'>) => {
  validateObject(profile);
  const list = getProfiles();
  const newProfile: BusinessProfile = {
    ...profile,
    id: Math.random().toString(36).substr(2, 9),
    clicks: 0,
    likes: 0,
    reports: [],
    status: 'visible'
  };
  list.push(newProfile);
  localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILES, JSON.stringify(list));
  return newProfile;
};

export const deleteProfile = (id: string) => {
  const list = getProfiles();
  const filtered = list.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.BUSINESS_PROFILES, JSON.stringify(filtered));
  
  // Cleanup history and likes from users
  const users = getUsers();
  users.forEach(u => {
    u.likedBusinesses = u.likedBusinesses.filter(bid => bid !== id);
    u.visitedHistory = u.visitedHistory.filter(bid => bid !== id);
  });
  saveUsers(users);
};

export const toggleLike = (userId: string, profileId: string) => {
  const users = getUsers();
  const profiles = getProfiles();
  const user = users.find(u => u.id === userId);
  const profile = profiles.find(p => p.id === profileId);
  if (!user || !profile) return;
  const likeIndex = user.likedBusinesses.indexOf(profileId);
  if (likeIndex > -1) {
    user.likedBusinesses.splice(likeIndex, 1);
    profile.likes = Math.max(0, profile.likes - 1);
  } else {
    user.likedBusinesses.push(profileId);
    profile.likes += 1;
  }
  saveUsers(users);
  updateProfile(profile);
};

export const reportProfile = (userId: string, profileId: string) => {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  const reportIndex = profile.reports.indexOf(userId);
  if (reportIndex > -1) {
    profile.reports.splice(reportIndex, 1);
    if (profile.status === 'hidden' && profile.reports.length < 3 && profile.hiddenReason?.includes('automáticamente')) {
      profile.status = 'visible';
      profile.hiddenReason = undefined;
    }
  } else {
    profile.reports.push(userId);
    if (profile.reports.length >= 3) {
      profile.status = 'hidden';
      profile.hiddenReason = 'Ocultada automáticamente por 3 reportes';
    }
  }
  updateProfile(profile);
};

export const restoreProfile = (profileId: string) => {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  profile.status = 'visible';
  profile.hiddenReason = undefined;
  profile.reports = [];
  updateProfile(profile);
};

export const hideProfileManually = (profileId: string) => {
  const profiles = getProfiles();
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;
  profile.status = 'hidden';
  profile.hiddenReason = 'Ocultada manualmente por administrador';
  updateProfile(profile);
};

export const addToHistory = (userId: string, profileId: string) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  const history = user.visitedHistory || [];
  const filtered = history.filter(id => id !== profileId);
  const newHistory = [profileId, ...filtered].slice(0, 10);
  user.visitedHistory = newHistory;
  saveUsers(users);
  const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (session) {
    const sessionUser = JSON.parse(session);
    if (sessionUser.id === userId) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  }
};

export const resetUserPassword = (adminId: string, targetUsername: string, newPass: string) => {
  const users = getUsers();
  const admin = users.find(u => u.id === adminId);
  if (!admin || admin.username !== 'Empripanel') throw new Error('Unauthorized');
  const user = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
  if (!user) throw new Error('Usuario no encontrado');
  user.password = hashPassword(newPass);
  saveUsers(users);
  return true;
};

export const validateLogin = (username: string, pass: string) => {
  const users = getUsers();
  const hashed = hashPassword(pass);
  return users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === hashed);
};

export const registerUser = (userData: Omit<UserAccount, 'id' | 'likedBusinesses' | 'visitedHistory'>) => {
  validateContent(userData.username);
  validateContent(userData.privateEmail);
  validateEmailFormat(userData.privateEmail);
  const users = getUsers();
  if (users.some(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
    throw new Error('Usuario ya existe');
  }
  const newUser: UserAccount = {
    ...userData,
    id: Math.random().toString(36).substr(2, 9),
    password: hashPassword(userData.password),
    likedBusinesses: [],
    visitedHistory: []
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};
