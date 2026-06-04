'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useBarbershopInvitations } from '@/hooks/useBarbershopInvitations';
import { useBarbershopMembers } from '@/hooks/useBarbershopMembers';
import { supabase } from '@/lib/supabase';
import { createBarbershopForProfessional, checkBarbershopSlugAvailability } from '@/services/barbershopService';
import {
  getReceivedInvitations,
  acceptInvitation,
  cancelInvitation,
} from '@/services/barbershopInvitationService';
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
  TbArrowLeft,
  TbUsers,
} from 'react-icons/tb';
import {
  Barbershop,
  BarbershopMember,
  BarbershopMemberRole,
  BarbershopInvitation,
  ReceivedInvitation,
  Professional,
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

// ─── CreateBarbershopForm ─────────────────────────────────────────────────────

function CreateBarbershopForm({
  professional,
  onCreated,
  onCancel,
}: {
  professional: Professional;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName]         = useState(professional.name);
  const [slug, setSlug]         = useState(professional.slug);
  const [slugError, setSlugError] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const validateSlug = async (value: string): Promise<boolean> => {
    if (!value) { setSlugError('El slug es requerido'); return false; }
    if (!SLUG_REGEX.test(value)) {
      setSlugError('Solo letras minúsculas, números y guiones');
      return false;
    }
    const available = await checkBarbershopSlugAvailability(value);
    if (!available) { setSlugError('Este slug ya está en uso'); return false; }
    setSlugError('');
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generar slug desde el nombre solo si el slug aún coincide con el original
    if (slug === professional.slug || slug === '') {
      const generated = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated || professional.slug);
      setSlugError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    if (!trimmedName) { setFormError('El nombre es requerido'); return; }
    const slugOk = await validateSlug(slug);
    if (!slugOk) return;

    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      await createBarbershopForProfessional(user.id, {
        id: professional.id,
        name: trimmedName,
        slug,
        phone:        professional.phone        ?? undefined,
        bio:          professional.bio           ?? undefined,
        profile_image: professional.profile_image ?? undefined,
        location:     professional.location      ?? undefined,
        map_embed_url: professional.map_embed_url ?? undefined,
        social_links: professional.social_links  ?? undefined,
      });

      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear la barbería';
      setFormError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Crear mi barbería</h3>
          <p className="text-sm text-gray-500 mt-1">
            Podrás modificar esta información después desde la configuración.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Nombre */}
          <div>
            <label htmlFor="bs-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la barbería
            </label>
            <input
              id="bs-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Barbería El Señor"
              disabled={creating}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="bs-slug" className="block text-sm font-medium text-gray-700 mb-1">
              URL de la barbería
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 flex-shrink-0">barberia/</span>
              <input
                id="bs-slug"
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugError(''); }}
                onBlur={() => validateSlug(slug)}
                disabled={creating}
                className={`block flex-1 px-3 py-2 border rounded-lg text-sm font-mono placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 ${
                  slugError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
                }`}
              />
            </div>
            {slugError && <p className="mt-1 text-xs text-red-600">{slugError}</p>}
          </div>

          {/* Error general */}
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={creating}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !!slugError}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear barbería'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ReceivedInvitationCard ───────────────────────────────────────────────────

// Errores que devuelve accept_barbershop_invitation() y su mensaje al usuario
const ACCEPT_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated:                  'Tu sesión expiró. Recarga la página.',
  invitation_not_found_or_expired:    'La invitación ya no es válida o expiró.',
  professional_profile_not_found:     'No se encontró tu perfil profesional.',
  already_member_of_another_barbershop:
    'Ya eres miembro activo de otra barbería. Debes salir de ella antes de unirte a una nueva.',
};

function ReceivedInvitationCard({
  invitation,
  onAccepted,
  onDeclined,
}: {
  invitation: ReceivedInvitation;
  onAccepted: () => void;
  onDeclined: (id: string) => void;
}) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [cardError, setCardError] = useState('');

  const barbershopName = invitation.barbershop?.name ?? 'Barbería desconocida';
  const initial        = barbershopName.charAt(0).toUpperCase();
  const expiresDate    = new Date(invitation.expires_at).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const busy = accepting || declining;

  const handleAccept = async () => {
    setAccepting(true);
    setCardError('');
    try {
      const result = await acceptInvitation(invitation.token);
      if (result.success) {
        toast.success(`Te has unido a ${barbershopName}`);
        onAccepted(); // → refresh() en la página → BarbershopContent
      } else {
        const msg = ACCEPT_ERROR_MESSAGES[result.error ?? '']
          ?? 'Error al aceptar la invitación';
        setCardError(msg);
      }
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Error al aceptar la invitación');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await cancelInvitation(invitation.id);
      onDeclined(invitation.id); // optimistic: elimina del estado local sin reload
      toast.success('Invitación rechazada');
    } catch {
      toast.error('Error al rechazar la invitación');
      setDeclining(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Logo o inicial */}
        {invitation.barbershop?.logo_url ? (
          <img
            src={invitation.barbershop.logo_url}
            alt={barbershopName}
            className="h-12 w-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {initial}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{barbershopName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <RoleBadge role={invitation.role} />
            <span className="text-xs text-gray-400">· Expira {expiresDate}</span>
          </div>
        </div>
      </div>

      {/* Error informativo (ej: ya eres miembro de otra barbería) */}
      {cardError && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <TbAlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{cardError}</p>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={handleDecline}
          disabled={busy}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {declining ? '...' : 'Rechazar'}
        </button>
        <button
          onClick={handleAccept}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {accepting ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Aceptando...
            </>
          ) : 'Aceptar'}
        </button>
      </div>
    </div>
  );
}

// ─── JoinBarbershopView ───────────────────────────────────────────────────────

function JoinBarbershopView({
  onJoined,
  onBack,
}: {
  onJoined: () => void;
  onBack: () => void;
}) {
  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getReceivedInvitations();
        if (!cancelled) setInvitations(data);
      } catch {
        if (!cancelled) setLoadError('Error al cargar las invitaciones. Intenta nuevamente.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDeclined = (id: string) => {
    // Actualización optimista: elimina del estado local sin recargar
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
  };

  return (
    <div className="flex justify-center min-h-[500px] p-4 pt-8">
      <div className="w-full max-w-lg">
        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            <TbArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Unirme a una barbería</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Si un dueño te ha invitado, tus invitaciones aparecerán aquí.
            </p>
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="md" text="Buscando invitaciones..." />
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-4 text-sm text-red-700 text-center">
            <TbAlertCircle className="h-6 w-6 mx-auto mb-2 text-red-400" />
            {loadError}
          </div>
        )}

        {!loading && !loadError && invitations.length === 0 && (
          <div className="text-center py-16">
            <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <TbInbox className="h-7 w-7 text-gray-400" />
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">
              Sin invitaciones pendientes
            </h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Pídele al dueño de la barbería que te invite usando tu email de Turnate.
            </p>
            <button
              onClick={onBack}
              className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <TbArrowLeft className="h-4 w-4" />
              Volver
            </button>
          </div>
        )}

        {!loading && !loadError && invitations.length > 0 && (
          <div className="space-y-4">
            {invitations.map((inv) => (
              <ReceivedInvitationCard
                key={inv.id}
                invitation={inv}
                onAccepted={onJoined}
                onDeclined={handleDeclined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NoBarbershopState ────────────────────────────────────────────────────────

type NoBarbershopView = 'choice' | 'create' | 'join';

function NoBarbershopState({
  professional,
  onCreated,
}: {
  professional: Professional;
  onCreated: () => void;
}) {
  const [view, setView] = useState<NoBarbershopView>('choice');

  if (view === 'create') {
    return (
      <CreateBarbershopForm
        professional={professional}
        onCreated={onCreated}
        onCancel={() => setView('choice')}
      />
    );
  }

  if (view === 'join') {
    return (
      <JoinBarbershopView
        onJoined={onCreated}   // onCreated llama a refresh() — mismo efecto
        onBack={() => setView('choice')}
      />
    );
  }

  // view === 'choice'
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <TbBuildingStore className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No perteneces a ninguna barbería
        </h3>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Puedes seguir usando Turnate como profesional independiente. Crea una barbería
          únicamente cuando necesites gestionar un equipo.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => setView('create')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <TbUserPlus className="h-4 w-4" />
            Crear barbería
          </button>
          <button
            onClick={() => setView('join')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            <TbUsers className="h-4 w-4" />
            Unirme a una barbería
          </button>
        </div>
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

// ─── MemberCard ──────────────────────────────────────────────────────────────

function MemberCard({ member }: { member: BarbershopMember }) {
  const name       = member.professional?.name ?? 'Profesional';
  const slug       = member.professional?.slug;
  const profileImg = member.professional?.profile_image;
  const initial    = name.charAt(0).toUpperCase();

  const joinedDate = new Date(member.joined_at).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Avatar */}
      {profileImg ? (
        <img
          src={profileImg}
          alt={name}
          className="h-10 w-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {initial}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <RoleBadge role={member.role} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {slug && (
            <span className="text-xs text-gray-400 font-mono">@{slug}</span>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <TbCalendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{joinedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MembersSection ───────────────────────────────────────────────────────────

function MembersSection({
  members,
  loading,
}: {
  members: BarbershopMember[];
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TbUsers className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Equipo
          </h3>
        </div>
        {!loading && members.length > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {members.length} miembro{members.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Estados */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="sm" text="Cargando equipo..." />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <TbUsers className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Sin miembros activos</p>
        </div>
      ) : (
        <div>
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
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
  const {
    professional,
    barbershop,
    membership,
    isOwner,
    loading,
    error,
    refresh,
  } = useBarbershop();

  // Los hooks usan barbershop?.id — si es undefined, permanecen inactivos (no queries)
  const {
    invitations,
    loading: invLoading,
    sending,
    sendInvitation,
    cancelInvitation,
  } = useBarbershopInvitations(barbershop?.id);

  const {
    members,
    loading: membersLoading,
  } = useBarbershopMembers(barbershop?.id);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={refresh} />;

  // Sin membresía activa: el professional es independiente o aún no creó barbería.
  // El estado correcto en BD es: professional existe, cero memberships activas.
  if (!barbershop || !membership) {
    return professional ? (
      <NoBarbershopState professional={professional} onCreated={refresh} />
    ) : (
      <LoadingState />
    );
  }

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

        {/* Equipo: visible para owner y barbero */}
        <MembersSection
          members={members}
          loading={membersLoading}
        />

        {/* Invitaciones: solo el dueño puede gestionar */}
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
