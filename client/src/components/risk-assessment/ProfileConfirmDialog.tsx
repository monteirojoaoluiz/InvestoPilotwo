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
  if (!investorProfile) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
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
          <Button variant="outline" onClick={onCancel} className="flex-1">
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
