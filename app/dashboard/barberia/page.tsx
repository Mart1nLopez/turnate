'use client';

import { useState } from 'react';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useBarbershopInvitations } from '@/hooks/useBarbershopInvitations';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import {
  TbBuildingStore,
  TbRefresh,
  TbAlertCircle,
  TbMapPin,
  TbPhone,
  TbLink,
  TbCalendar,
  TbCrown,
  TbScissors,
  TbCircleCheck,
  TbClock,
  TbMail,
  TbSend,
  TbX,
  TbUserPlus,
  TbInbox,
} from 'react-icons/tb';
import {
  Barbershop,
  BarbershopMember,
  BarbershopMemberRole,
  BarbershopInvitation,
} from '@/types';

// ─── Badges y utilitarios ─────────────────────────────────────────────────────

function RoleBadge({ role }: { role: BarbershopMemberRole }) {
  if (role === 'owner') {
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        <TbCrown className="h-4 w-4" />
        Dueño
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
      <TbScissors className="h-4 w-4" />
      Barbero
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
      <TbCircleCheck className="h-3.5 w-3.5" />
      Activa
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
      Inactiva
    </span>
  );
}

function ApprovalBadge({ approved }: { approved: boolean }) {
  return approved ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
      Aprobada
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
      Pendiente de aprobación
    </span>
  );
}

function BarbershopLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-200">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── Estados de la página ─────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <LoadingSpinner size="lg" text="Cargando barbería..." />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-sm">
        <TbAlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <TbRefresh className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <TbBuildingStore className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin barbería asignada</h3>
        <p className="text-sm text-gray-500">
          No perteneces a ninguna barbería. Cuando te unas o crees una, aparecerá aquí.
        </p>
      </div>
    </div>
  );
}

// ─── InvitationItem ───────────────────────────────────────────────────────────

function InvitationItem({
  invitation,
  onCancel,
}: {
  invitation: BarbershopInvitation;
  onCancel: (id: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const expiresDate = new Date(invitation.expires_at).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(invitation.id);
      // El item desaparece de la lista tras el cancel (hook filtra localmente)
    } catch {
      setCancelling(false);
      setConfirming(false);
    }
  };

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-gray-100 last:border-0">
      {/* Info */}
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <TbMail className="h-4 w-4 text-gray-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{invitation.email}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <RoleBadge role={invitation.role} />
            <span className="text-xs text-gray-400">· Expira {expiresDate}</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <TbX className="h-3.5 w-3.5" />
            Cancelar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">¿Cancelar invitación?</span>
            <button
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {cancelling ? '...' : 'Sí'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={cancelling}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              No
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

// ─── InvitationsSection ───────────────────────────────────────────────────────

function InvitationsSection({
  invitations,
  loading,
  sending,
  onSend,
  onCancel,
}: {
  invitations: BarbershopInvitation[];
  loading: boolean;
  sending: boolean;
  onSend: (email: string, role: BarbershopMemberRole) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BarbershopMemberRole>('barber');
  const [emailError, setEmailError] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('El email es requerido');
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Ingresa un email válido');
      return;
    }

    try {
      await onSend(trimmed, role);
      setEmail(''); // Limpia el formulario solo en caso de éxito
    } catch {
      // El hook ya muestra el toast con el error específico (duplicado, RPC, etc.)
      // No limpiamos el email para que el usuario pueda corregirlo
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TbUserPlus className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Invitar barbero
          </h3>
        </div>
        {invitations.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            {invitations.length} pendiente{invitations.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Email */}
          <div className="flex-1">
            <label htmlFor="inv-email" className="block text-xs font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              id="inv-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              placeholder="barbero@ejemplo.cl"
              disabled={sending}
              className={`block w-full px-3 py-2 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 transition-colors ${
                emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
              }`}
            />
            {emailError && (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            )}
          </div>

          {/* Rol */}
          <div className="sm:w-36">
            <label htmlFor="inv-role" className="block text-xs font-medium text-gray-600 mb-1">
              Rol
            </label>
            <select
              id="inv-role"
              value={role}
              onChange={(e) => setRole(e.target.value as BarbershopMemberRole)}
              disabled={sending}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="barber">Barbero</option>
            </select>
          </div>

          {/* Botón */}
          <div className="sm:self-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
            >
              {sending ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <TbSend className="h-4 w-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Divisor */}
      <div className="mt-6 mb-4 border-t border-gray-100" />

      {/* Lista de invitaciones pendientes */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Invitaciones pendientes
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" text="Cargando..." />
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TbInbox className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Sin invitaciones pendientes</p>
            <p className="text-xs text-gray-300 mt-0.5">
              Las invitaciones enviadas aparecerán aquí
            </p>
          </div>
        ) : (
          <ul className="divide-y-0">
            {invitations.map((inv) => (
              <InvitationItem key={inv.id} invitation={inv} onCancel={onCancel} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── BarbershopContent ────────────────────────────────────────────────────────

function BarbershopContent({
  barbershop,
  membership,
  isOwner,
}: {
  barbershop: Barbershop;
  membership: BarbershopMember;
  isOwner: boolean;
}) {
  const joinedDate = new Date(membership.joined_at).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hasSocialLinks =
    barbershop.social_links && Object.values(barbershop.social_links).some(Boolean);

  return (
    <div className="space-y-4">
      {/* Tarjeta principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <BarbershopLogo name={barbershop.name} logoUrl={barbershop.logo_url} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate mb-2">{barbershop.name}</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              <StatusBadge active={barbershop.is_active} />
              {isOwner && <ApprovalBadge approved={barbershop.is_approved} />}
            </div>
            {barbershop.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{barbershop.description}</p>
            )}
          </div>
        </div>

        {(barbershop.phone || barbershop.location || barbershop.slug) && (
          <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {barbershop.slug && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TbLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded truncate">
                  /barberia/{barbershop.slug}
                </span>
              </div>
            )}
            {barbershop.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TbPhone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{barbershop.phone}</span>
              </div>
            )}
            {barbershop.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600 sm:col-span-2">
                <TbMapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{barbershop.location}</span>
              </div>
            )}
          </div>
        )}

        {hasSocialLinks && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            {Object.entries(barbershop.social_links ?? {})
              .filter(([, v]) => !!v)
              .map(([network]) => (
                <span
                  key={network}
                  className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 capitalize"
                >
                  {network}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Tarjeta de membresía */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Mi membresía
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Rol</p>
            <RoleBadge role={membership.role} />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Miembro desde</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
              <TbCalendar className="h-4 w-4 text-gray-400" />
              {joinedDate}
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500 mb-1">Tipo de cuenta</p>
            <p className="text-sm text-gray-700">
              {isOwner
                ? 'Eres el dueño de esta barbería. Puedes invitar barberos y administrar el equipo.'
                : 'Eres miembro de esta barbería. El dueño gestiona la configuración y el equipo.'}
            </p>
          </div>
        </div>
      </div>

      {/* Dirección estructurada (si existe) */}
      {(barbershop.address || barbershop.city || barbershop.region) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Dirección
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {barbershop.address && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Calle y número</p>
                <p className="text-gray-700">{barbershop.address}</p>
              </div>
            )}
            {barbershop.city && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Ciudad</p>
                <p className="text-gray-700">{barbershop.city}</p>
              </div>
            )}
            {barbershop.region && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Región</p>
                <p className="text-gray-700">{barbershop.region}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nota de funcionalidad futura (diferente para owner vs barber) */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
        <div className="flex items-start gap-2">
          <TbClock className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            {isOwner
              ? 'Próximamente podrás ver estadísticas del equipo, gestionar miembros activos y personalizar la página pública de la barbería.'
              : 'Próximamente podrás ver las estadísticas de tu rendimiento dentro de la barbería.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function BarbershopDashboardPage() {
  const { barbershop, membership, isOwner, loading, error, refresh } = useBarbershop();

  // El hook usa barbershop?.id — si es undefined, permanece inactivo (no queries)
  const {
    invitations,
    loading: invLoading,
    sending,
    sendInvitation,
    cancelInvitation,
  } = useBarbershopInvitations(barbershop?.id);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={refresh} />;
  if (!barbershop || !membership) return <EmptyState />;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Mi Barbería</h1>
            <RoleBadge role={membership.role} />
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            {isOwner
              ? 'Gestiona la información de tu negocio'
              : `Formas parte de ${barbershop.name}`}
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-700"
        >
          <TbRefresh className="h-4 w-4 mr-2" />
          Actualizar
        </button>
      </motion.div>

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="space-y-4"
      >
        <BarbershopContent
          barbershop={barbershop}
          membership={membership}
          isOwner={isOwner}
        />

        {/* Sección de invitaciones: solo el dueño puede gestionar */}
        {isOwner && (
          <InvitationsSection
            invitations={invitations}
            loading={invLoading}
            sending={sending}
            onSend={sendInvitation}
            onCancel={cancelInvitation}
          />
        )}
      </motion.div>
    </div>
  );
}
