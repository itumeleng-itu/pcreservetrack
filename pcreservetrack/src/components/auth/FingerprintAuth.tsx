
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Fingerprint, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FingerprintAuthProps {
  onAuthSuccess: () => void;
}

export function FingerprintAuth({ onAuthSuccess }: FingerprintAuthProps) {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check if WebAuthn and fingerprint authentication are available
  React.useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if PublicKeyCredential is available (WebAuthn support)
        if (
          window.PublicKeyCredential &&
          window.navigator.credentials &&
          window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable
        ) {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } else {
          setIsSupported(false);
        }
      } catch (error) {
        console.error("Error checking fingerprint support:", error);
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  const handleFingerprintAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simple challenge for demonstration purposes
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      
      // Request fingerprint authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname
        }
      });
      
      if (credential) {
        toast({
          title: "Authentication successful",
          description: "You have been authenticated with your fingerprint",
        });
        onAuthSuccess();
      }
    } catch (error) {
      console.error("Fingerprint authentication error:", error);
      toast({
        title: "Authentication failed",
        description: "Could not authenticate with fingerprint",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isSupported === null) {
    return <div className="text-center p-2">Checking fingerprint support...</div>;
  }

  if (isSupported === false) {
    return (
      <div className="flex flex-col items-center p-2 text-center gap-2">
        <AlertCircle className="h-5 w-5 text-yellow-500" />
        <p className="text-sm text-gray-500">Fingerprint login not supported on this device</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 border border-gray-200 rounded-md bg-gray-50">
      <div className="flex items-center gap-2">
        <Fingerprint className="h-6 w-6 text-blue-600" />
        <span className="font-medium">Fingerprint Login</span>
      </div>
      <p className="text-sm text-gray-500 text-center">
        Use your device's fingerprint reader to log in quickly and securely
      </p>
      <Button 
        onClick={handleFingerprintAuth} 
        disabled={isAuthenticating}
        variant="outline"
        className="w-full"
      >
        {isAuthenticating ? (
          <>
            <span className="animate-pulse">Scanning...</span>
          </>
        ) : (
          <>
            <Fingerprint className="mr-2 h-4 w-4" />
            Login with fingerprint
          </>
        )}
      </Button>
    </div>
  );
}
