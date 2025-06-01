
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useAuthActions } from "@/hooks/useAuthActions";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Upload, Trash2, Moon, Sun } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const { deleteAccount } = useAuthActions();
  const { toast } = useToast();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const navigate = useNavigate();

  // Initialize dark mode based on local storage or system preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

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

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      navigate('/');
    }
    setDeleteDialogOpen(false);
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        
        <div className="flex justify-between items-center p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>Dark Mode</span>
          </div>
          <Switch 
            checked={isDarkMode} 
            onCheckedChange={toggleDarkMode} 
          />
        </div>
        
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
        
        <div className="pt-6 border-t">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Permanently delete your account and all associated data.
          </p>
          <Button 
            variant="destructive" 
            onClick={() => setDeleteDialogOpen(true)}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
          </Button>
        </div>
      </div>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProfilePage;
