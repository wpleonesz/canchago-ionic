// Contrato real verificado contra canchago/validations/auth/register.validation.ts y
// canchago/services/auth/register.service.ts (feature 016) — no el Swagger, que hoy no puede
// generarse por un problema preexistente de canchago/documentation (ver roadmap.md, 010).
export type RegisterAccountType = 'futbolista' | 'gestor-de-cancha';

export interface RegisterOrganizationInput {
  name: string;
  legalName?: string;
  taxIdentification?: string;
  email?: string;
  phone?: string;
  domain?: string;
}

export interface RegisterVenueInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface RegisterAccountFields {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export type RegisterRequest =
  | (RegisterAccountFields & { accountType: 'futbolista' })
  | (RegisterAccountFields & {
      accountType: 'gestor-de-cancha';
      organization: RegisterOrganizationInput;
      venue: RegisterVenueInput;
    });

interface RegisterResponseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// El backend nunca devuelve contraseña ni tokens de sesión — el registro no inicia sesión
// (ver spec 008, "Decisiones": el login real sigue el flujo existente de las features 002/003).
export type RegisterResponse =
  | { accountType: 'futbolista'; user: RegisterResponseUser }
  | {
      accountType: 'gestor-de-cancha';
      user: RegisterResponseUser;
      accessRequestId: string;
      organizationStatus: 'PENDING_APPROVAL';
    };
