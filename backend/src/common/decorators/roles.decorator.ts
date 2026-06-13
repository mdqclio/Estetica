import { SetMetadata } from '@nestjs/common';
import { Perfil } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe una ruta a los perfiles indicados. Ej: @Roles('ADMIN', 'RECEPCIONISTA') */
export const Roles = (...roles: Perfil[]) => SetMetadata(ROLES_KEY, roles);
