import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InvestorProfile } from "@/lib/profileHumanizer";
import { useLocation } from "wouter";

import ProfileDisplay from "../ProfileDisplay";

interface ProfileConfirmDialogProps {
  open: boolean;
  investorProfile: InvestorProfile | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ProfileConfirmDialog({
  open,
  investorProfile,
  onConfirm,
  onCancel,
}: ProfileConfirmDialogProps) {
  const [, setLocation] = useLocation();

  if (!investorProfile) return null;

  const handleClose = () => {
    onCancel();
    setLocation("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modify Investor Profile?</DialogTitle>
          <DialogDescription>
            You already have an investor profile. Would you like to modify it?
            Here's your current profile:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <ProfileDisplay investorProfile={investorProfile} />
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" variant="outline" onClick={handleClose}>
            Keep Current Profile
          </Button>

          <Button onClick={onConfirm} className="flex-1">
            Modify Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
