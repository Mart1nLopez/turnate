'use client';

import {
  TbUser,
  TbMapPin,
  TbDeviceFloppy,
  TbLink,
  TbQrcode,
  TbQrcodeOff,
  TbCopy,
  TbBrandGoogle,
  TbCheck,
} from 'react-icons/tb';
import { FaInstagram, FaWhatsapp, FaSquareFacebook, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import PhoneInput from '@/components/ui/phone-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadWithCrop } from '@/components/ui/image-upload-with-crop';
import { ProfileImageUpload } from '@/components/ui/profile-image-upload';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useProfile } from '@/hooks/useProfile';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

export default function PerfilPage() {
  const {
    // Estado principal
    loading,
    submitting,

    // Formulario
    formData,
    setFormData,

    // Imágenes
    images,
    currentProfileImageUrl,

    // Validaciones
    slugError,
    checkingSlug,
    nameError,
    slugCharacterError,

    // QR
    showQR,
    setShowQR,
    qrRef,

    // Google
    isSyncedWithGoogle,
    handleGoogleSync,
    handleGoogleDisconnect,

    // Cropper
    showCropper,
    setShowCropper,

    // Funciones
    handleInputChange,
    handleSubmit,
    handleImagesChange,
    handleProfileImageChange,
    handleRemoveProfileImage,
    getPublicUrl,
    handleDownloadQR,
    handleCopyQR,
  } = useProfile();

  const { confirm, ConfirmDialog } = useConfirmDialog();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">Configura tu información pública</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbBrandGoogle className="w-5 h-5 mr-2 text-blue-600" />
            Integración con Google Calendar
          </CardTitle>
          <CardDescription>
            Sincroniza automáticamente tus citas de Turnate con tu calendario personal de Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {
            isSyncedWithGoogle ?
              // --- VISTA "CONECTADO" ---
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 p-2 bg-green-100 rounded-full">
                    <TbCheck className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Conectado a Google Calendar</h4>
                    <p className="text-sm text-green-700">Tus nuevas citas se añadirán a tu calendario.</p>
                  </div>
                </div>
                <Button
                  type="button" // Importante: no enviar el formulario principal
                  variant="destructive"
                  size="sm"
                  onClick={() => handleGoogleDisconnect(confirm)}
                  disabled={submitting}
                  className="flex-shrink-0 w-full sm:w-auto">
                  Desconectar
                </Button>
              </div>
              // --- VISTA "DESCONECTADO" ---
            : <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 border rounded-lg gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Conecta tu calendario</h4>
                  <p className="text-sm text-gray-500">Permite que Turnate gestione eventos en tu Google Calendar.</p>
                </div>
                <Button
                  type="button" // Importante
                  variant="outline"
                  onClick={handleGoogleSync}
                  disabled={submitting}
                  className="flex-shrink-0 w-full sm:w-auto">
                  <TbBrandGoogle className="w-4 h-4 mr-2" />
                  Conectar con Google
                </Button>
              </div>

          }
        </CardContent>
      </Card>

      {/* Public URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TbLink className="w-5 h-5 mr-2" />
            Tu Página Pública
          </CardTitle>
          <CardDescription>Esta es la URL que puedes compartir con tus clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:space-x-3 space-y-3 md:space-y-0">
            <div className="flex-1 flex items-center space-x-3">
              <Input value={getPublicUrl()} readOnly className="flex-1 bg-gray-50" />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(getPublicUrl());
                  toast.success('URL copiada al portapapeles');
                }}
                variant="outline">
                <TbCopy className="w-4 h-4 mr-2" />
                Link
              </Button>
              <Button onClick={() => window.open(getPublicUrl(), '_blank')} variant="default">
                Ver página
              </Button>
            </div>
            <Button
              className="text-xl text-blue-700 hover:text-blue-800"
              variant="outline"
              type="button"
              onClick={() => setShowQR((prev) => !prev)}>
              {showQR ?
                <TbQrcodeOff />
              : <>
                  <TbQrcode />
                </>
              }
            </Button>
          </div>
          {showQR && (
            <div className="flex flex-col items-center mt-4">
              <span className="text-xs text-gray-500 mb-1">Presiona el QR para copiarlo</span>
              <div
                ref={qrRef}
                style={{
                  background: 'white',
                  padding: 16,
                  borderRadius: 12,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #0001',
                }}
                onClick={handleCopyQR}
                title="Copiar QR al portapapeles">
                <QRCode
                  value={getPublicUrl()}
                  size={192}
                  style={{ height: 'auto', maxWidth: '100%', width: '192px' }}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  level="M"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs px-3 py-1 h-7"
                onClick={handleDownloadQR}
                type="button">
                Descargar Imagen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Tu información de contacto y descripción</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="text-gray-700">Nombre completo</span>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <TbUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Tu nombre"
                      className={`pl-10 ${nameError ? 'border-red-500' : ''}`}
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div>{nameError && <p className="text-red-500 text-sm">{nameError}</p>}</div>
                    <p className={`text-xs ${formData.name.length > 25 ? 'text-orange-500' : 'text-gray-500'}`}>
                      {formData.name.length}/30 caracteres
                    </p>
                  </div>
                </div>
                <div>
                  <PhoneInput
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        phone: value,
                      }));
                    }}
                    id="phone-number"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Columna izquierda: URL y Bio */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL personalizada (slug)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <TbLink className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="tu-nombre-unico"
                        className={`pl-10 ${
                          slugError || slugCharacterError ? 'border-red-500'
                          : checkingSlug ? 'border-yellow-500'
                          : ''
                        }`}
                        maxLength={25}
                        required
                      />
                      {checkingSlug && (
                        <div className="absolute right-3 top-3">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-start mt-1">
                      <div className="flex flex-col">
                        {(slugError || slugCharacterError) && (
                          <p className="text-red-500 text-sm">{slugError || slugCharacterError}</p>
                        )}
                        {!slugError && !slugCharacterError && !checkingSlug && formData.slug && (
                          <p className="text-green-600 text-sm">✓ Slug disponible</p>
                        )}
                      </div>
                      <p className={`text-xs ${formData.slug.length > 15 ? 'text-orange-500' : 'text-gray-500'}`}>
                        {formData.slug.length}/25 caracteres
                      </p>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      Tu URL será: {process.env.NEXT_PUBLIC_APP_URL || 'https://turnate.cl'}/{formData.slug}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción / Bio</label>
                    <Textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Cuéntales a tus clientes sobre ti y tu experiencia..."
                      rows={4}
                    />
                  </div>
                </div>
                {/* Columna derecha: Foto de perfil */}
                <div className="flex flex-col items-center justify-center">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Foto de Perfil (o Logo)</label>
                  <ProfileImageUpload
                    currentImageUrl={currentProfileImageUrl}
                    onImageChange={handleProfileImageChange}
                    onRemoveImage={handleRemoveProfileImage}
                    disabled={submitting}
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
            <CardDescription>Información sobre dónde atiendes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <div className="relative">
                <TbMapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Calle Ejemplo 123, Comuna, Ciudad"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL del mapa embebido (Google Maps)
              </label>
              <Input
                name="map_embed_url"
                value={formData.map_embed_url}
                onChange={handleInputChange}
                placeholder='&lt;iframe src="https://www.google.com/maps/embed?pb=..."&gt;&lt;/iframe&gt;'
              />
              <p className="text-xs text-gray-500 mt-1">
                Ve a Google Maps, busca tu ubicación, haz clic en &quot;Compartir&quot; → &quot;Incorporar un mapa&quot;
                y selecciona &quot;Copiar HTML&quot;.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociales</CardTitle>
            <CardDescription>Enlaces a tus perfiles de redes sociales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                <div className="relative">
                  <FaInstagram className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@tu_usuario"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
                <div className="relative">
                  <FaWhatsapp className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                  <PhoneInput
                    value={formData.whatsapp}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        whatsapp: value,
                      }));
                    }}
                    id="whatsapp-number"
                    allClassName="pl-10"
                    prefixClassName="border-l-1 border-gray-200 px-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
                <div className="relative">
                  <FaSquareFacebook className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    placeholder="Tu página de Facebook"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TikTok</label>
                <div className="relative">
                  <FaTiktok className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="tiktok"
                    value={formData.tiktok}
                    onChange={handleInputChange}
                    placeholder="@tu_usuario"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                <div className="relative">
                  <FaXTwitter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    placeholder="@usuario o enlace"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">YouTube</label>
                <div className="relative">
                  <FaYoutube className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleInputChange}
                    placeholder="Canal o enlace"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imágenes del Perfil</CardTitle>
            <CardDescription>Agrega imágenes que se mostrarán en tu página pública</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUploadWithCrop
              onFilesChange={handleImagesChange}
              multiple={true}
              maxFiles={6}
              existingImages={images.map((img) => img.url)}
              enableCrop={true}
              cropAspectRatio={16 / 9}
              onCropperStateChange={setShowCropper}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        {!showCropper && (
          <div className="fixed bottom-8 right-8 z-50">
            <Button type="submit" disabled={submitting} variant="highlight" className="px-8">
              <TbDeviceFloppy className="w-4 h-4 mr-2" />
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        )}
      </form>

      <ConfirmDialog />
    </div>
  );
}
