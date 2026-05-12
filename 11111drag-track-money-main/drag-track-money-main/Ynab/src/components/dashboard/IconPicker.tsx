import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Upload, Link, X, Check } from "lucide-react";
import { getCroppedImg } from "@/lib/image-utils";
import { authenticatedFetch } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  currentIconUrl?: string;
  onIconUploaded: (url: string) => void;
  onCroppingStateChange?: (isCropping: boolean) => void;
}

export const IconPicker = ({ currentIconUrl, onIconUploaded, onCroppingStateChange }: IconPickerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImage(reader.result as string);
        setIsCropping(true);
        if (onCroppingStateChange) onCroppingStateChange(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleConfirmCrop = async () => {
    try {
      if (!image || !croppedAreaPixels) return;
      setIsUploading(true);
      
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Falha ao recortar imagem");

      // Upload imediato para garantir que não se perca
      const formData = new FormData();
      formData.append("file", croppedBlob, "icon.png");
      
      const response = await authenticatedFetch("/icons/upload/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Falha no upload do ícone");
      const data = await response.json();
      
      console.log("✅ Ícone enviado com sucesso:", data.url);
      onIconUploaded(data.url);
      setIsCropping(false);
      if (onCroppingStateChange) onCroppingStateChange(false);
      setImage(null);
    } catch (error: any) {
      console.error("🔴 Erro no upload do ícone:", error);
      toast.error("Erro ao processar ícone: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isCropping && image ? (
        <div className="space-y-4">
          <div className="relative h-64 w-full rounded-xl overflow-hidden bg-muted border border-border/60 shadow-inner">
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" className="flex-1" onClick={() => { 
               setIsCropping(false); 
               if (onCroppingStateChange) onCroppingStateChange(false);
               setImage(null); 
             }}>
               Cancelar
             </Button>
             <Button 
               className="flex-1 gradient-primary" 
               onClick={handleConfirmCrop}
               disabled={isUploading}
             >
               {isUploading ? "Enviando..." : "Confirmar"}
             </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center justify-center py-2">
            <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 group overflow-hidden hover:border-primary/60 transition-all cursor-pointer">
               {currentIconUrl ? (
                 <img src={currentIconUrl} alt="Icon Preview" className="h-full w-full object-cover" />
               ) : (
                 <Upload className="h-8 w-8 text-primary/40 group-hover:text-primary transition-colors" />
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 className="absolute inset-0 opacity-0 cursor-pointer" 
                 onChange={handleFileChange}
               />
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            Toque acima para trocar a imagem
          </p>
        </div>
      )}
    </div>
  );
};
