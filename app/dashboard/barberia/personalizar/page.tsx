'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useBarbershopCustomization } from '@/hooks/useBarbershopCustomization';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ThemeSelector from '@/components/barbershopCustomize/ThemeSelector';
import BarbershopPagePreview from '@/components/barbershopCustomize/BarbershopPagePreview';
import { getThemeById } from '@/lib/barbershopThemes';
import type { ThemeId } from '@/types';
import {
  TbArrowLeft,
  TbExternalLink,
  TbBuildingStore,
  TbPhoto,
  TbDeviceFloppy,
  TbAlertCircle,
  TbRefresh,
  TbUpload,
  TbEye,
  TbPalette,
} from 'react-icons/tb';

// ─── Local sub-components ────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <LoadingSpinner size="lg" text="Cargando..." />
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

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
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

function UploadTrigger({
  label,
  onClick,
  disabled,
  uploading,
  saving,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  uploading: boolean;
  saving: boolean;
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
        <>
          <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          {uploading ? 'Subiendo...' : 'Guardando...'}
        </>
      ) : (
        <>
          <TbUpload className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonalizarPage() {
  const router = useRouter();

  const { barbershop, isOwner, loading, error, refresh, updateBarbershop } = useBarbershop();
  const { uploading, saving, uploadLogo, uploadCover } = useBarbershopCustomization(barbershop?.id);

  const [description, setDescription]       = useState('');
  const [savingDesc, setSavingDesc]         = useState(false);
  const [selectedTheme, setSelectedTheme]   = useState<ThemeId>('luxury-gold');
  const [savingTheme, setSavingTheme]       = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  const logoInputRef  = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sync local state from loaded barbershop
  useEffect(() => {
    if (barbershop) {
      setDescription(barbershop.description ?? '');
      setSelectedTheme((barbershop.theme as ThemeId | undefined) ?? 'luxury-gold');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbershop?.id]);

  // Redirect non-owners
  useEffect(() => {
    if (!loading && (!barbershop || !isOwner)) {
      router.replace('/dashboard/barberia');
    }
  }, [loading, barbershop, isOwner, router]);

  const busy = uploading || saving || savingDesc || savingTheme;

  // ── Logo ──────────────────────────────────────────────────────────────────

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (logoInputRef.current) logoInputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)     { toast.error('El archivo debe ser menor a 5 MB'); return; }
    try {
      await uploadLogo(file);
      await refresh();
    } catch { /* hook ya mostró toast */ }
  };

  // ── Portada ───────────────────────────────────────────────────────────────

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return; }
    if (file.size > 5 * 1024 * 1024)     { toast.error('El archivo debe ser menor a 5 MB'); return; }
    try {
      await uploadCover(file);
      await refresh();
    } catch { /* hook ya mostró toast */ }
  };

  // ── Descripción ───────────────────────────────────────────────────────────

  const handleSaveDescription = async () => {
    setSavingDesc(true);
    try {
      await updateBarbershop({ description: description.trim() });
      toast.success('Descripción guardada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar la descripción');
    } finally {
      setSavingDesc(false);
    }
  };

  // ── Tema ──────────────────────────────────────────────────────────────────

  const handleThemeSelect = async (themeId: ThemeId) => {
    if (themeId === selectedTheme || savingTheme) return;
    const previous = selectedTheme;
    setSelectedTheme(themeId); // optimistic update → preview changes instantly
    setSavingTheme(true);
    try {
      await updateBarbershop({ theme: themeId });
      toast.success(`Tema "${getThemeById(themeId).name}" guardado`);
    } catch {
      setSelectedTheme(previous); // revert on error
      toast.error('No se pudo guardar el tema');
    } finally {
      setSavingTheme(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading)               return <LoadingState />;
  if (error)                 return <ErrorState message={error} onRetry={refresh} />;
  if (!barbershop || !isOwner) return null;

  const activeTheme = getThemeById(selectedTheme);

  return (
    <div className="p-6 lg:p-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/barberia"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Volver a Mi Barbería"
          >
            <TbArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Personalizar barbería</h1>
            <p className="text-gray-500 mt-0.5 text-sm">
              Página pública de{' '}
              <span className="font-medium text-gray-700">{barbershop.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Vista previa completa */}
          <button
            type="button"
            onClick={() => setShowFullPreview(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm text-sm font-medium"
          >
            <TbEye className="h-4 w-4" />
            Vista previa completa
          </button>

          {/* Ver página pública */}
          <Link
            href={`/barberia/${barbershop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium text-gray-700"
          >
            <TbExternalLink className="h-4 w-4" />
            Ver página pública
          </Link>
        </div>
      </motion.div>

      {/* ── Body: 2-column layout on xl ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ── LEFT: Settings ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Logo */}
          <SectionCard
            title="Logo"
            hint="Aparece en el encabezado de tu página pública. Se muestra como imagen cuadrada."
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {barbershop.logo_url ? (
                <div className="h-20 w-20 rounded-2xl overflow-hidden border border-gray-200 flex-shrink-0 shadow-sm">
                  <Image
                    src={barbershop.logo_url}
                    alt={`Logo de ${barbershop.name}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center flex-shrink-0">
                  <TbBuildingStore className="h-9 w-9 text-blue-300" />
                </div>
              )}
              <div className="space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogoChange}
                  disabled={busy}
                />
                <UploadTrigger
                  label="Cambiar logo"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={busy}
                  uploading={uploading}
                  saving={saving}
                />
                <p className="text-xs text-gray-400">PNG, JPG o WebP · Máx. 5 MB</p>
              </div>
            </div>
          </SectionCard>

          {/* Portada */}
          <SectionCard
            title="Imagen de portada"
            hint="Aparece como fondo en el encabezado de tu página pública."
          >
            {barbershop.cover_image_url ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 mb-4 shadow-sm">
                <Image
                  src={barbershop.cover_image_url}
                  alt={`Portada de ${barbershop.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 700px"
                />
              </div>
            ) : (
              <div className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 mb-4">
                <TbPhoto className="h-9 w-9 text-gray-300" />
                <p className="text-sm text-gray-400">Sin imagen de portada</p>
              </div>
            )}
            <div className="space-y-2">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverChange}
                disabled={busy}
              />
              <UploadTrigger
                label="Cambiar portada"
                onClick={() => coverInputRef.current?.click()}
                disabled={busy}
                uploading={uploading}
                saving={saving}
              />
              <p className="text-xs text-gray-400">
                PNG, JPG o WebP · Máx. 5 MB · Proporción 16:9 o similar
              </p>
            </div>
          </SectionCard>

          {/* Descripción */}
          <SectionCard
            title="Descripción"
            hint="Describe tu barbería. Aparece en el encabezado de tu página pública."
          >
            <div className="space-y-4">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={busy}
                rows={4}
                maxLength={500}
                placeholder={`Contanos sobre ${barbershop.name}, tu estilo y lo que ofrecés...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {description.length}/500 caracteres
                </span>
                <button
                  type="button"
                  onClick={handleSaveDescription}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {savingDesc ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <TbDeviceFloppy className="h-4 w-4" />
                      Guardar descripción
                    </>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* ── Tema visual ─────────────────────────────────────────────── */}
          <SectionCard
            title="Tema visual"
            hint="Elige el estilo visual de tu página pública. El cambio se aplica instantáneamente."
          >
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: activeTheme.backgroundColor }}
              >
                <TbPalette
                  className="w-4 h-4"
                  style={{ color: activeTheme.accentColor }}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{activeTheme.name}</p>
                <p className="text-xs text-gray-500">{activeTheme.description}</p>
              </div>
              <div className="ml-auto flex gap-1">
                {/* Accent swatches */}
                <div
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ background: activeTheme.backgroundColor }}
                  title="Fondo"
                />
                <div
                  className="w-4 h-4 rounded-full border border-white shadow-sm"
                  style={{ background: activeTheme.accentColor }}
                  title="Acento"
                />
              </div>
            </div>

            <ThemeSelector
              selectedTheme={selectedTheme}
              onSelect={handleThemeSelect}
              saving={savingTheme}
            />
          </SectionCard>
        </motion.div>

        {/* ── RIGHT: Compact preview (sticky on xl) ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="xl:sticky xl:top-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            {/* Preview header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Preview en vivo
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Se actualiza al cambiar el tema
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <TbEye className="w-3.5 h-3.5" />
                Ampliar
              </button>
            </div>

            {/* Compact preview */}
            <BarbershopPagePreview
              barbershop={barbershop}
              theme={activeTheme}
              mode="compact"
            />
          </div>
        </motion.div>
      </div>

      {/* ── Fullscreen preview modal ─────────────────────────────────────── */}
      {showFullPreview && (
        <BarbershopPagePreview
          barbershop={barbershop}
          theme={activeTheme}
          mode="fullscreen"
          onClose={() => setShowFullPreview(false)}
        />
      )}
    </div>
  );
}
