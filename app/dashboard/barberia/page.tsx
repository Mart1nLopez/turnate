'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useBarbershopCustomization } from '@/hooks/useBarbershopCustomization';
import { useBarbershopMembers } from '@/hooks/useBarbershopMembers';
import { useBarbershopInvitations } from '@/hooks/useBarbershopInvitations';
import { supabase } from '@/lib/supabase';
import {
  createBarbershopForProfessional,
  checkBarbershopSlugAvailability,
} from '@/services/barbershopService';
import {
  getReceivedInvitations,
  acceptInvitation,
  cancelInvitation as cancelInvitationService,
} from '@/services/barbershopInvitationService';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ThemeSelector from '@/components/barbershopCustomize/ThemeSelector';
import BarbershopPagePreview from '@/components/barbershopCustomize/BarbershopPagePreview';
import { getThemeById } from '@/lib/barbershopThemes';
import {
  TbBuildingStore,
  TbRefresh,
  TbAlertCircle,
  TbExternalLink,
  TbArrowLeft,
  TbUsers,
  TbInbox,
  TbUserPlus,
  TbCircleCheck,
  TbCalendar,
  TbCrown,
  TbScissors,
  TbDeviceFloppy,
  TbUpload,
  TbCircleX,
  TbWorld,
  TbPhone,
  TbMapPin,
  TbLock,
  TbEye,
  TbPalette,
  TbPhoto,
  TbMail,
  TbSend,
  TbX,
  TbBrandInstagram,
  TbBrandWhatsapp,
  TbBrandFacebook,
  TbBrandTiktok,
  TbBrandYoutube,
  TbBrandX,
  TbShieldCheck,
} from 'react-icons/tb';
import type {
  ThemeId,
  Barbershop,
  BarbershopMember,
  BarbershopMemberRole,
  BarbershopInvitation,
  ReceivedInvitation,
  Professional,
} from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'informacion' | 'apariencia' | 'equipo';

type SlugStatus =
  | 'idle'
  | 'unchanged'
  | 'checking'
  | 'available'
  | 'taken'
  | 'too-short'
  | 'invalid-format';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'informacion', label: 'Información' },
  { id: 'apariencia',  label: 'Apariencia'  },
  { id: 'equipo',      label: 'Equipo'       },
];

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

const ACCEPT_ERROR_MESSAGES: Record<string, string> = {
  not_authenticated:                   'Tu sesión expiró. Recarga la página.',
  invitation_not_found_or_expired:     'La invitación ya no es válida o expiró.',
  professional_profile_not_found:      'No se encontró tu perfil profesional.',
  already_member_of_another_barbershop:
    'Ya eres miembro activo de otra barbería. Debes salir de ella antes de unirte a una nueva.',
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function validateSlugFormat(slug: string): 'too-short' | 'invalid-format' | 'valid' {
  if (slug.length < 3) return 'too-short';
  if (!SLUG_REGEX.test(slug)) return 'invalid-format';
  return 'valid';
}

function inputCls(disabled: boolean) {
  return `block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    disabled ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'
  }`;
}

function iconInputCls(disabled: boolean) {
  return `block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    disabled ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'
  }`;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function LoadingState({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <LoadingSpinner size="lg" text={text} />
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

function RoleBadge({ role, compact }: { role: BarbershopMemberRole; compact?: boolean }) {
  const base = compact
    ? 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium'
    : 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium';
  const iconCls = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  if (role === 'owner') {
    return (
      <span className={`${base} bg-blue-100 text-blue-800`}>
        <TbCrown className={iconCls} />
        Dueño
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className={`${base} bg-purple-100 text-purple-800`}>
        <TbShieldCheck className={iconCls} />
        Admin
      </span>
    );
  }
  return (
    <span className={`${base} bg-gray-100 text-gray-700`}>
      <TbScissors className={iconCls} />
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

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-600 mb-1">
      {children}
    </label>
  );
}

function SaveButton({ onClick, saving, disabled }: { onClick: () => void; saving: boolean; disabled?: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={saving || !!disabled}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        {saving ? (
          <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
        ) : (
          <><TbDeviceFloppy className="h-4 w-4" />Guardar</>
        )}
      </button>
    </div>
  );
}

function UploadTrigger({ label, onClick, disabled, uploading, saving }: {
  label: string; onClick: () => void; disabled: boolean; uploading: boolean; saving: boolean;
}) {
  const busy = uploading || saving;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
    >
      {busy ? (
        <><div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />{uploading ? 'Subiendo...' : 'Guardando...'}</>
      ) : (
        <><TbUpload className="h-4 w-4" />{label}</>
      )}
    </button>
  );
}

function SlugStatusBadge({ status }: { status: SlugStatus }) {
  if (status === 'idle' || status === 'unchanged') return null;
  if (status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <div className="h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Verificando...
      </span>
    );
  }
  if (status === 'available') {
    return <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><TbCircleCheck className="h-3.5 w-3.5" />Disponible</span>;
  }
  if (status === 'taken') {
    return <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium"><TbCircleX className="h-3.5 w-3.5" />Ya en uso</span>;
  }
  if (status === 'too-short') return <span className="text-xs text-orange-600">Mínimo 3 caracteres</span>;
  return <span className="text-xs text-red-600">Solo letras minúsculas, números y guiones (no al inicio ni al final)</span>;
}

function ReadOnlyNotice() {
  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6 text-sm text-amber-800">
      <TbLock className="h-5 w-5 text-amber-500 flex-shrink-0" />
      <p>Solo el dueño puede editar esta información. Estás viendo en modo lectura.</p>
    </div>
  );
}

// ─── Onboarding: CreateBarbershopForm ─────────────────────────────────────────

function CreateBarbershopForm({
  professional,
  onCreated,
  onCancel,
}: {
  professional: Professional;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName]           = useState(professional.name);
  const [slug, setSlug]           = useState(professional.slug);
  const [slugError, setSlugError] = useState('');
  const [creating, setCreating]   = useState(false);
  const [formError, setFormError] = useState('');

  const FORM_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  const validateSlug = async (value: string): Promise<boolean> => {
    if (!value) { setSlugError('El slug es requerido'); return false; }
    if (!FORM_SLUG_REGEX.test(value)) { setSlugError('Solo letras minúsculas, números y guiones'); return false; }
    const available = await checkBarbershopSlugAvailability(value);
    if (!available) { setSlugError('Este slug ya está en uso'); return false; }
    setSlugError('');
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
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
        phone:         professional.phone        ?? undefined,
        bio:           professional.bio           ?? undefined,
        location:      professional.location      ?? undefined,
        map_embed_url: professional.map_embed_url ?? undefined,
        social_links:  professional.social_links  ?? undefined,
      });
      onCreated();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al crear la barbería');
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
          {formError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
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
                <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando...</>
              ) : 'Crear barbería'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Onboarding: ReceivedInvitationCard ───────────────────────────────────────

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
        onAccepted();
      } else {
        setCardError(ACCEPT_ERROR_MESSAGES[result.error ?? ''] ?? 'Error al aceptar la invitación');
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
      await cancelInvitationService(invitation.id);
      onDeclined(invitation.id);
      toast.success('Invitación rechazada');
    } catch {
      toast.error('Error al rechazar la invitación');
      setDeclining(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start gap-4">
        {invitation.barbershop?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
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
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{barbershopName}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <RoleBadge role={invitation.role} />
            <span className="text-xs text-gray-400">· Expira {expiresDate}</span>
          </div>
        </div>
      </div>
      {cardError && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <TbAlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>{cardError}</p>
          </div>
        </div>
      )}
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
            <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Aceptando...</>
          ) : 'Aceptar'}
        </button>
      </div>
    </div>
  );
}

// ─── Onboarding: JoinBarbershopView ───────────────────────────────────────────

function JoinBarbershopView({ onJoined, onBack }: { onJoined: () => void; onBack: () => void }) {
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

  const handleDeclined = (id: string) => setInvitations((prev) => prev.filter((inv) => inv.id !== id));

  return (
    <div className="flex justify-center min-h-[500px] p-4 pt-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Volver">
            <TbArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Unirme a una barbería</h3>
            <p className="text-sm text-gray-500 mt-0.5">Si un dueño te ha invitado, tus invitaciones aparecerán aquí.</p>
          </div>
        </div>
        {loading && <div className="flex justify-center py-16"><LoadingSpinner size="md" text="Buscando invitaciones..." /></div>}
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
            <h4 className="text-sm font-medium text-gray-900 mb-1">Sin invitaciones pendientes</h4>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Pídele al dueño de la barbería que te invite usando tu email de Turnate.
            </p>
            <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <TbArrowLeft className="h-4 w-4" />
              Volver
            </button>
          </div>
        )}
        {!loading && !loadError && invitations.length > 0 && (
          <div className="space-y-4">
            {invitations.map((inv) => (
              <ReceivedInvitationCard key={inv.id} invitation={inv} onAccepted={onJoined} onDeclined={handleDeclined} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onboarding: NoBarbershopState ────────────────────────────────────────────

type NoBarbershopView = 'choice' | 'create' | 'join';

function NoBarbershopState({ professional, onCreated }: { professional: Professional; onCreated: () => void }) {
  const [view, setView] = useState<NoBarbershopView>('choice');

  if (view === 'create') {
    return <CreateBarbershopForm professional={professional} onCreated={onCreated} onCancel={() => setView('choice')} />;
  }
  if (view === 'join') {
    return <JoinBarbershopView onJoined={onCreated} onBack={() => setView('choice')} />;
  }
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <TbBuildingStore className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No perteneces a ninguna barbería</h3>
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

// ─── Tab Navigation ───────────────────────────────────────────────────────────

function TabNav({ activeTab }: { activeTab: TabId }) {
  return (
    <nav className="flex border-b border-gray-200 mb-6 -mx-6 lg:-mx-8 px-6 lg:px-8 overflow-x-auto">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/dashboard/barberia?tab=${tab.id}`}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

// ─── Tab: Información ─────────────────────────────────────────────────────────

interface InformacionTabProps {
  barbershop: Barbershop;
  canManage: boolean;
  updateBarbershop: (data: Partial<Omit<Barbershop, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  uploading: boolean;
  mediaSaving: boolean;
  refresh: () => Promise<void>;
}

function InformacionTab({ barbershop, canManage, updateBarbershop, uploadLogo, uploading, mediaSaving, refresh }: InformacionTabProps) {
  const readOnly = !canManage;

  const [name, setName]       = useState('');
  const [slug, setSlug]       = useState('');
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [phone, setPhone]     = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [address, setAddress]         = useState('');
  const [city, setCity]               = useState('');
  const [region, setRegion]           = useState('');
  const [location, setLocation]       = useState('');
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp]   = useState('');
  const [facebook, setFacebook]   = useState('');
  const [tiktok, setTiktok]       = useState('');
  const [youtube, setYoutube]     = useState('');
  const [twitter, setTwitter]     = useState('');
  const [savingSocial, setSavingSocial] = useState(false);

  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoInputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(barbershop.name);
    setSlug(barbershop.slug);
    setPhone(barbershop.phone ?? '');
    setAddress(barbershop.address ?? '');
    setCity(barbershop.city ?? '');
    setRegion(barbershop.region ?? '');
    setLocation(barbershop.location ?? '');
    setMapEmbedUrl(barbershop.map_embed_url ?? '');
    setInstagram(barbershop.social_links?.instagram ?? '');
    setWhatsapp(barbershop.social_links?.whatsapp ?? '');
    setFacebook(barbershop.social_links?.facebook ?? '');
    setTiktok(barbershop.social_links?.tiktok ?? '');
    setYoutube(barbershop.social_links?.youtube ?? '');
    setTwitter(barbershop.social_links?.twitter ?? '');
    setSlugStatus('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershop.id]);

  useEffect(() => {
    return () => { if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current); };
  }, []);

  const handleSlugChange = useCallback(
    (value: string) => {
      const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      setSlug(normalized);
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current);
      if (normalized === barbershop.slug) { setSlugStatus('unchanged'); return; }
      const fmt = validateSlugFormat(normalized);
      if (fmt !== 'valid') { setSlugStatus(fmt); return; }
      setSlugStatus('checking');
      slugDebounceRef.current = setTimeout(async () => {
        try {
          const available = await checkBarbershopSlugAvailability(normalized, barbershop.id);
          setSlugStatus(available ? 'available' : 'taken');
        } catch { setSlugStatus('idle'); }
      }, 500);
    },
    [barbershop.slug, barbershop.id],
  );

  const logoBusy = uploading || mediaSaving;

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (logoInputRef.current) logoInputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('El archivo debe ser menor a 5 MB'); return; }
    try { await uploadLogo(file); await refresh(); } catch { /* hook ya mostró toast */ }
  };

  const slugChanged     = slug.trim() !== barbershop.slug;
  const slugSaveBlocked = slugChanged &&
    (['taken', 'too-short', 'invalid-format', 'checking'] as SlugStatus[]).includes(slugStatus);

  const handleSaveIdentity = async () => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    if (!trimmedName) { toast.error('El nombre es requerido'); return; }
    if (!trimmedSlug) { toast.error('El slug es requerido'); return; }
    if (trimmedSlug !== barbershop.slug) {
      const fmt = validateSlugFormat(trimmedSlug);
      if (fmt !== 'valid') { toast.error('Slug inválido'); return; }
      if (slugStatus === 'taken')    { toast.error('Este slug ya está en uso'); return; }
      if (slugStatus === 'checking') { toast.error('Espera mientras se verifica el slug'); return; }
    }
    setSavingIdentity(true);
    try {
      await updateBarbershop({ name: trimmedName, slug: trimmedSlug });
      setSlugStatus('idle');
      toast.success('Identidad guardada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setSavingIdentity(false); }
  };

  const handleSaveContact = async () => {
    setSavingContact(true);
    try { await updateBarbershop({ phone: phone.trim() }); toast.success('Contacto guardado'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setSavingContact(false); }
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    try {
      await updateBarbershop({ address: address.trim(), city: city.trim(), region: region.trim(), location: location.trim(), map_embed_url: mapEmbedUrl.trim() });
      toast.success('Ubicación guardada');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setSavingLocation(false); }
  };

  const handleSaveSocial = async () => {
    setSavingSocial(true);
    try {
      await updateBarbershop({ social_links: { instagram: instagram.trim(), whatsapp: whatsapp.trim(), facebook: facebook.trim(), tiktok: tiktok.trim(), youtube: youtube.trim(), twitter: twitter.trim() } });
      toast.success('Redes sociales guardadas');
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setSavingSocial(false); }
  };

  const anySaving = logoBusy || savingIdentity || savingContact || savingLocation || savingSocial;

  return (
    <div className="space-y-4">
      {readOnly && <ReadOnlyNotice />}

      {/* Logo */}
      <SectionCard title="Logo" hint="Aparece en el encabezado de tu página pública.">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {barbershop.logo_url ? (
            <div className="h-20 w-20 rounded-2xl overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm">
              <Image src={barbershop.logo_url} alt={`Logo de ${barbershop.name}`} width={80} height={80} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center flex-shrink-0">
              <TbBuildingStore className="h-9 w-9 text-blue-300" />
            </div>
          )}
          {!readOnly && (
            <div className="space-y-2">
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleLogoChange} disabled={anySaving} />
              <UploadTrigger label="Cambiar logo" onClick={() => logoInputRef.current?.click()} disabled={anySaving} uploading={uploading} saving={mediaSaving} />
              <p className="text-xs text-gray-400">PNG, JPG o WebP · Máx. 5 MB</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Identidad */}
      <SectionCard title="Identidad" hint="Nombre y URL pública de la barbería.">
        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="tab-name">Nombre</FieldLabel>
            <input id="tab-name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={readOnly || savingIdentity} maxLength={100} placeholder="Nombre de la barbería" className={inputCls(readOnly || savingIdentity)} />
          </div>
          <div>
            <FieldLabel htmlFor="tab-slug">Slug (URL pública)</FieldLabel>
            <div className={`flex items-center border rounded-lg overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${readOnly || savingIdentity ? 'border-gray-200' : 'border-gray-300'}`}>
              <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-200 whitespace-nowrap flex-shrink-0 select-none">/barberia/</span>
              <input id="tab-slug" type="text" value={slug} onChange={(e) => !readOnly && handleSlugChange(e.target.value)} disabled={readOnly || savingIdentity} maxLength={60} placeholder="mi-barberia"
                className={`flex-1 px-3 py-2 text-sm placeholder-gray-400 focus:outline-none transition-colors ${readOnly || savingIdentity ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'}`} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <SlugStatusBadge status={slugStatus} />
              {slugChanged && !(['checking', 'too-short', 'invalid-format'] as SlugStatus[]).includes(slugStatus) && (
                <span className="text-xs text-amber-600">⚠ Cambiar el slug modifica la URL pública</span>
              )}
            </div>
          </div>
          {!readOnly && <SaveButton onClick={handleSaveIdentity} saving={savingIdentity} disabled={slugSaveBlocked} />}
        </div>
      </SectionCard>

      {/* Contacto */}
      <SectionCard title="Contacto" hint="Número de teléfono visible en tu página pública.">
        <div className="space-y-5">
          <div>
            <FieldLabel htmlFor="tab-phone">Teléfono</FieldLabel>
            <div className="relative">
              <TbPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input id="tab-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={readOnly || savingContact} placeholder="+56 9 1234 5678" className={iconInputCls(readOnly || savingContact)} />
            </div>
          </div>
          {!readOnly && <SaveButton onClick={handleSaveContact} saving={savingContact} />}
        </div>
      </SectionCard>

      {/* Ubicación */}
      <SectionCard title="Ubicación" hint="Dirección, ciudad y referencia en el mapa.">
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="tab-address">Dirección</FieldLabel>
            <input id="tab-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} disabled={readOnly || savingLocation} placeholder="Av. Ejemplo 123" className={inputCls(readOnly || savingLocation)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="tab-city">Ciudad</FieldLabel>
              <input id="tab-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} disabled={readOnly || savingLocation} placeholder="Santiago" className={inputCls(readOnly || savingLocation)} />
            </div>
            <div>
              <FieldLabel htmlFor="tab-region">Región</FieldLabel>
              <input id="tab-region" type="text" value={region} onChange={(e) => setRegion(e.target.value)} disabled={readOnly || savingLocation} placeholder="Región Metropolitana" className={inputCls(readOnly || savingLocation)} />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="tab-location">Coordenadas o referencia</FieldLabel>
            <div className="relative">
              <TbMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input id="tab-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} disabled={readOnly || savingLocation} placeholder="-33.4489, -70.6693" className={iconInputCls(readOnly || savingLocation)} />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="tab-map">URL del mapa embebido (Google Maps)</FieldLabel>
            <input id="tab-map" type="url" value={mapEmbedUrl} onChange={(e) => setMapEmbedUrl(e.target.value)} disabled={readOnly || savingLocation} placeholder="https://www.google.com/maps/embed?pb=..." className={inputCls(readOnly || savingLocation)} />
          </div>
          {!readOnly && <SaveButton onClick={handleSaveLocation} saving={savingLocation} />}
        </div>
      </SectionCard>

      {/* Redes sociales */}
      <SectionCard title="Redes sociales" hint="Los enlaces aparecen en tu página pública. Dejá en blanco los que no uses.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { id: 'tab-instagram', icon: TbBrandInstagram, value: instagram, setter: setInstagram, label: 'Instagram',   placeholder: 'https://instagram.com/tu-barberia', type: 'url' },
              { id: 'tab-whatsapp',  icon: TbBrandWhatsapp,  value: whatsapp,  setter: setWhatsapp,  label: 'WhatsApp',    placeholder: '+56912345678', type: 'tel' },
              { id: 'tab-facebook',  icon: TbBrandFacebook,  value: facebook,  setter: setFacebook,  label: 'Facebook',    placeholder: 'https://facebook.com/tu-barberia', type: 'url' },
              { id: 'tab-tiktok',    icon: TbBrandTiktok,    value: tiktok,    setter: setTiktok,    label: 'TikTok',      placeholder: 'https://tiktok.com/@tu-barberia', type: 'url' },
              { id: 'tab-youtube',   icon: TbBrandYoutube,   value: youtube,   setter: setYoutube,   label: 'YouTube',     placeholder: 'https://youtube.com/@tu-barberia', type: 'url' },
              { id: 'tab-twitter',   icon: TbBrandX,         value: twitter,   setter: setTwitter,   label: 'Twitter / X', placeholder: 'https://x.com/tu-barberia', type: 'url' },
            ] as const).map(({ id, icon: Icon, value, setter, label, placeholder, type }) => (
              <div key={id}>
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input id={id} type={type} value={value} onChange={(e) => setter(e.target.value)} disabled={readOnly || savingSocial} placeholder={placeholder} className={iconInputCls(readOnly || savingSocial)} />
                </div>
              </div>
            ))}
          </div>
          {!readOnly && <SaveButton onClick={handleSaveSocial} saving={savingSocial} />}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Tab: Apariencia ──────────────────────────────────────────────────────────

interface AparienciaTabProps {
  barbershop: Barbershop;
  canManage: boolean;
  updateBarbershop: (data: Partial<Omit<Barbershop, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  uploadCover: (file: File) => Promise<void>;
  uploading: boolean;
  mediaSaving: boolean;
  refresh: () => Promise<void>;
}

function AparienciaTab({ barbershop, canManage, updateBarbershop, uploadCover, uploading, mediaSaving, refresh }: AparienciaTabProps) {
  const readOnly = !canManage;

  const [description, setDescription]         = useState('');
  const [savingDesc, setSavingDesc]           = useState(false);
  const [selectedTheme, setSelectedTheme]     = useState<ThemeId>('luxury-gold');
  const [savingTheme, setSavingTheme]         = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDescription(barbershop.description ?? '');
    setSelectedTheme((barbershop.theme as ThemeId | undefined) ?? 'luxury-gold');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershop.id]);

  const coverBusy = uploading || mediaSaving;

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('El archivo debe ser menor a 5 MB'); return; }
    try { await uploadCover(file); await refresh(); } catch { /* hook ya mostró toast */ }
  };

  const handleSaveDescription = async () => {
    setSavingDesc(true);
    try { await updateBarbershop({ description: description.trim() }); toast.success('Descripción guardada'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Error al guardar'); }
    finally { setSavingDesc(false); }
  };

  const handleThemeSelect = async (themeId: ThemeId) => {
    if (themeId === selectedTheme || savingTheme || readOnly) return;
    const previous = selectedTheme;
    setSelectedTheme(themeId);
    setSavingTheme(true);
    try {
      await updateBarbershop({ theme: themeId });
      toast.success(`Tema "${getThemeById(themeId).name}" guardado`);
    } catch {
      setSelectedTheme(previous);
      toast.error('No se pudo guardar el tema');
    } finally { setSavingTheme(false); }
  };

  const activeTheme = getThemeById(selectedTheme);
  const busy = coverBusy || savingDesc || savingTheme;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
      <div className="space-y-4">
        {readOnly && <ReadOnlyNotice />}

        {/* Portada */}
        <SectionCard title="Imagen de portada" hint="Aparece como fondo en el encabezado de tu página pública.">
          {barbershop.cover_image_url ? (
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 mb-4 shadow-sm">
              <Image src={barbershop.cover_image_url} alt={`Portada de ${barbershop.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 700px" />
            </div>
          ) : (
            <div className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 mb-4">
              <TbPhoto className="h-9 w-9 text-gray-300" />
              <p className="text-sm text-gray-400">Sin imagen de portada</p>
            </div>
          )}
          {!readOnly && (
            <div className="space-y-2">
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleCoverChange} disabled={busy} />
              <UploadTrigger label="Cambiar portada" onClick={() => coverInputRef.current?.click()} disabled={busy} uploading={uploading} saving={mediaSaving} />
              <p className="text-xs text-gray-400">PNG, JPG o WebP · Máx. 5 MB · Proporción 16:9 o similar</p>
            </div>
          )}
        </SectionCard>

        {/* Descripción */}
        <SectionCard title="Descripción" hint="Describe tu barbería. Aparece en el encabezado de tu página pública.">
          <div className="space-y-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readOnly || savingDesc}
              rows={4}
              maxLength={500}
              placeholder={`Contanos sobre ${barbershop.name}, tu estilo y lo que ofrecés...`}
              className={`block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${readOnly || savingDesc ? 'bg-gray-50 text-gray-500' : 'bg-white text-gray-900'}`}
            />
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-400">{description.length}/500 caracteres</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {savingDesc ? (
                    <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                  ) : (
                    <><TbDeviceFloppy className="h-4 w-4" />Guardar descripción</>
                  )}
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Tema visual */}
        <SectionCard title="Tema visual" hint="Elige el estilo visual de tu página pública. El cambio se aplica instantáneamente.">
          <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: activeTheme.backgroundColor }}>
              <TbPalette className="w-4 h-4" style={{ color: activeTheme.accentColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{activeTheme.name}</p>
              <p className="text-xs text-gray-500">{activeTheme.description}</p>
            </div>
            <div className="ml-auto flex gap-1">
              <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: activeTheme.backgroundColor }} />
              <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: activeTheme.accentColor }} />
            </div>
          </div>
          <ThemeSelector selectedTheme={selectedTheme} onSelect={handleThemeSelect} saving={savingTheme} />
        </SectionCard>
      </div>

      {/* Preview sticky (xl) */}
      <div className="xl:sticky xl:top-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Preview en vivo</h3>
              <p className="text-xs text-gray-400 mt-0.5">Se actualiza al cambiar el tema</p>
            </div>
            <button type="button" onClick={() => setShowFullPreview(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              <TbEye className="w-3.5 h-3.5" />
              Ampliar
            </button>
          </div>
          <BarbershopPagePreview barbershop={barbershop} theme={activeTheme} mode="compact" />
        </div>
      </div>

      {showFullPreview && (
        <BarbershopPagePreview barbershop={barbershop} theme={activeTheme} mode="fullscreen" onClose={() => setShowFullPreview(false)} />
      )}
    </div>
  );
}

// ─── Tab: Equipo ──────────────────────────────────────────────────────────────

function MemberRow({ member, isOwner, isSelf, onRemove, onUpdateRole }: {
  member: BarbershopMember;
  isOwner: boolean;
  isSelf: boolean;
  onRemove: (id: string) => Promise<void>;
  onUpdateRole?: (id: string, role: BarbershopMemberRole) => Promise<void>;
}) {
  const [confirming, setConfirming]   = useState(false);
  const [removing, setRemoving]       = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const name       = member.professional?.name ?? 'Profesional';
  const profileImg = member.professional?.profile_image;
  const initial    = name.charAt(0).toUpperCase();
  // Only owner can remove non-owner members (not themselves)
  const canRemove    = isOwner && !isSelf && member.role !== 'owner';
  // Owner can change role of non-owner members (barber ↔ admin), but not themselves
  const canChangeRole = isOwner && !isSelf && member.role !== 'owner' && onUpdateRole;
  const joinedDate = new Date(member.joined_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleRemove = async () => {
    if (member.role === 'owner') return;
    setRemoving(true);
    try {
      await onRemove(member.id);
    } catch {
      toast.error('Error al eliminar el miembro. Intenta nuevamente.');
      setConfirming(false);
      setRemoving(false);
    }
  };

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as BarbershopMemberRole;
    if (newRole === member.role || !onUpdateRole) return;
    setUpdatingRole(true);
    try {
      await onUpdateRole(member.id, newRole);
    } catch {
      toast.error('Error al cambiar el rol. Intenta nuevamente.');
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-4 border-b border-gray-100 last:border-0">
      {profileImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profileImg} alt={name} className="h-10 w-10 rounded-full object-cover border border-gray-200 flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      ) : (
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">{initial}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          {!canChangeRole && <RoleBadge role={member.role} compact />}
        </div>
        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
          <TbCalendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{joinedDate}</span>
        </div>
      </div>

      {/* Role selector (owner only, for non-owner members) */}
      {canChangeRole && (
        <select
          value={member.role}
          onChange={handleRoleChange}
          disabled={updatingRole}
          aria-label="Cambiar rol"
          className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <option value="barber">Barbero</option>
          <option value="admin">Administrador</option>
        </select>
      )}

      {/* Remove button (owner only) */}
      {canRemove && (
        <div className="flex-shrink-0">
          {!confirming ? (
            <button onClick={() => setConfirming(true)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors">Quitar</button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">¿Confirmar?</span>
              <button onClick={() => setConfirming(false)} disabled={removing} className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 px-1.5 py-1 rounded hover:bg-gray-100 transition-colors">No</button>
              <button onClick={handleRemove} disabled={removing} className="text-xs text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded transition-colors">{removing ? '...' : 'Sí'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InvitationRow({ invitation, onCancel }: { invitation: BarbershopInvitation; onCancel: (id: string) => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const expiresDate = new Date(invitation.expires_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });

  const handleCancel = async () => {
    setCancelling(true);
    try { await onCancel(invitation.id); }
    catch { setCancelling(false); setConfirming(false); }
  };

  return (
    <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <TbMail className="h-4 w-4 text-gray-500" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{invitation.email}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <RoleBadge role={invitation.role} compact />
            <span className="text-xs text-gray-400">· Expira {expiresDate}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!confirming ? (
          <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
            <TbX className="h-3.5 w-3.5" />
            Cancelar
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">¿Cancelar?</span>
            <button onClick={handleCancel} disabled={cancelling} className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">{cancelling ? '...' : 'Sí'}</button>
            <button onClick={() => setConfirming(false)} disabled={cancelling} className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">No</button>
          </div>
        )}
      </div>
    </li>
  );
}

function EquipoTab({ barbershop, isOwner, isAdmin, currentProfessionalId }: {
  barbershop: Barbershop;
  isOwner: boolean;
  isAdmin: boolean;
  currentProfessionalId: string;
}) {
  const canManage = isOwner || isAdmin;

  const { members, loading: membersLoading, updateRole, deactivateMember } = useBarbershopMembers(barbershop.id);
  const { invitations, loading: invLoading, sending, sendInvitation, cancelInvitation } =
    useBarbershopInvitations(canManage ? barbershop.id : undefined);

  const [invEmail, setInvEmail]           = useState('');
  const [invEmailError, setInvEmailError] = useState('');
  // Owner can invite admins or barbers; admin can only invite barbers
  const [invRole, setInvRole]             = useState<BarbershopMemberRole>('barber');
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvEmailError('');
    const trimmed = invEmail.trim();
    if (!trimmed) { setInvEmailError('El email es requerido'); return; }
    if (!EMAIL_REGEX.test(trimmed)) { setInvEmailError('Ingresa un email válido'); return; }
    // Admin is restricted to barber role (enforced also by RLS on inv_insert_owner)
    const roleToSend: BarbershopMemberRole = isOwner ? invRole : 'barber';
    try { await sendInvitation(trimmed, roleToSend); setInvEmail(''); }
    catch { /* hook ya mostró toast */ }
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Equipo" hint="Todos los miembros activos de la barbería.">
        <div className="flex items-center justify-between mb-2">
          <span />
          {!membersLoading && members.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {members.length} miembro{members.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {membersLoading ? (
          <div className="flex items-center justify-center py-8"><LoadingSpinner size="sm" text="Cargando equipo..." /></div>
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TbUsers className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Sin miembros activos</p>
          </div>
        ) : (
          <div>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isOwner={isOwner}
                isSelf={member.professional_id === currentProfessionalId}
                onRemove={deactivateMember}
                onUpdateRole={isOwner ? updateRole : undefined}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {canManage && (
        <SectionCard
          title="Invitar miembro"
          hint={isOwner ? 'Invitá a un barbero o administrador a tu equipo.' : 'Invitá a un barbero a tu equipo.'}
        >
          <form onSubmit={handleSendInvitation} noValidate>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <FieldLabel htmlFor="equipo-inv-email">Email</FieldLabel>
                <input
                  id="equipo-inv-email"
                  type="email"
                  value={invEmail}
                  onChange={(e) => { setInvEmail(e.target.value); if (invEmailError) setInvEmailError(''); }}
                  placeholder="miembro@ejemplo.cl"
                  disabled={sending}
                  className={`block w-full px-3 py-2 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 transition-colors ${invEmailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}`}
                />
                {invEmailError && <p className="mt-1 text-xs text-red-600">{invEmailError}</p>}
              </div>
              {/* Role selector: owner only (admin always invites barbers) */}
              {isOwner && (
                <div className="sm:w-44">
                  <FieldLabel htmlFor="equipo-inv-role">Rol</FieldLabel>
                  <select
                    id="equipo-inv-role"
                    value={invRole}
                    onChange={(e) => setInvRole(e.target.value as BarbershopMemberRole)}
                    disabled={sending}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="barber">Barbero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              )}
              <div className="sm:self-end">
                <button type="submit" disabled={sending} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap">
                  {sending ? (
                    <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enviando...</>
                  ) : (
                    <><TbSend className="h-4 w-4" />Enviar invitación</>
                  )}
                </button>
              </div>
            </div>
          </form>
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invitaciones pendientes</p>
              {invitations.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {invitations.length} pendiente{invitations.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {invLoading ? (
              <div className="flex items-center justify-center py-8"><LoadingSpinner size="sm" text="Cargando..." /></div>
            ) : invitations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <TbInbox className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Sin invitaciones pendientes</p>
                <p className="text-xs text-gray-300 mt-0.5">Las invitaciones enviadas aparecerán aquí</p>
              </div>
            ) : (
              <ul className="divide-y-0">
                {invitations.map((inv) => (
                  <InvitationRow key={inv.id} invitation={inv} onCancel={cancelInvitation} />
                ))}
              </ul>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Main admin component (needs Suspense for useSearchParams) ────────────────

function BarbershopAdmin() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') ?? 'informacion') as TabId;

  const { barbershop, isOwner, isAdmin, canManage, membership, professional, loading, error, refresh, updateBarbershop } = useBarbershop();
  const { uploading, saving: mediaSaving, uploadLogo, uploadCover } = useBarbershopCustomization(barbershop?.id);

  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);

  if (loading) return <LoadingState text="Cargando barbería..." />;
  if (error)   return <ErrorState message={error} onRetry={refresh} />;

  if (!barbershop || !membership) {
    return professional ? (
      <NoBarbershopState professional={professional} onCreated={refresh} />
    ) : (
      <LoadingState text="Cargando barbería..." />
    );
  }

  return (
    <div className="p-6 lg:p-8">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900">{barbershop.name}</h1>
            <RoleBadge role={membership.role} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge active={barbershop.is_active} />
            {isOwner && <ApprovalBadge approved={barbershop.is_approved} />}
          </div>
          {origin && (
            <div className="flex items-center gap-2 mt-2">
              <TbWorld className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-500 font-mono truncate max-w-[260px] sm:max-w-md">
                {origin}/barberia/{barbershop.slug}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/barberia/${barbershop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-700"
          >
            <TbExternalLink className="h-4 w-4" />
            Ver página pública
          </Link>
          <button
            onClick={refresh}
            title="Actualizar"
            aria-label="Actualizar"
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
          >
            <TbRefresh className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Tab navigation ───────────────────────────────────────────────────── */}
      <TabNav activeTab={tab} />

      {/* ── Tab content ──────────────────────────────────────────────────────── */}
      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        {tab === 'informacion' && (
          <InformacionTab
            barbershop={barbershop}
            canManage={canManage}
            updateBarbershop={updateBarbershop}
            uploadLogo={uploadLogo}
            uploading={uploading}
            mediaSaving={mediaSaving}
            refresh={refresh}
          />
        )}
        {tab === 'apariencia' && (
          <AparienciaTab
            barbershop={barbershop}
            canManage={canManage}
            updateBarbershop={updateBarbershop}
            uploadCover={uploadCover}
            uploading={uploading}
            mediaSaving={mediaSaving}
            refresh={refresh}
          />
        )}
        {tab === 'equipo' && (
          <EquipoTab
            barbershop={barbershop}
            isOwner={isOwner}
            isAdmin={isAdmin}
            currentProfessionalId={professional?.id ?? ''}
          />
        )}
      </motion.div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function BarbershopDashboardPage() {
  return (
    <Suspense fallback={<LoadingState text="Cargando barbería..." />}>
      <BarbershopAdmin />
    </Suspense>
  );
}
