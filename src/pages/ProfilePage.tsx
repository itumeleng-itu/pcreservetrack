
import React, { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Upload, Trash2 } from 'lucide-react';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !currentUser) return;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${currentUser.id}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { 
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('registered')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been successfully uploaded.",
      });

      // Reset file input
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your avatar.",
        variant: "destructive",
      });
      console.error("Avatar upload error:", error);
    }
  };

  const removeAvatar = async () => {
    if (!currentUser) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([`${currentUser.id}/${currentUser.id}.*`]);

      const { error: dbError } = await supabase
        .from('registered')
        .update({ avatar_url: null })
        .eq('id', currentUser.id);

      if (storageError || dbError) {
        throw storageError || dbError;
      }

      toast({
        title: "Avatar Removed",
        description: "Your profile picture has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Remove Failed",
        description: "There was an error removing your avatar.",
        variant: "destructive",
      });
      console.error("Avatar remove error:", error);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32">
            <AvatarImage 
              src={currentUser?.avatar_url ?? undefined} 
              alt={`${currentUser?.name}'s avatar`} 
            />
            <AvatarFallback>
              <User className="h-16 w-16" />
            </AvatarFallback>
          </Avatar>

          <div className="flex space-x-2">
            <Input 
              type="file" 
              ref={fileInputRef}
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
              id="avatar-upload" 
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Select Image
            </Button>
            
            {avatarFile && (
              <Button onClick={uploadAvatar}>
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            )}

            {currentUser?.avatar_url && (
              <Button variant="destructive" onClick={removeAvatar}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
