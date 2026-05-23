"use client";

import { Button } from "@helvety/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@helvety/ui/dialog";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { useEffect, useState } from "react";

/**
 *
 */
interface SaveVaultDialogProps {
  readonly open: boolean;
  readonly defaultTitle: string;
  readonly isUpdate: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: (title: string) => void;
}

/** Prompt for vault document display title before encrypted save. */
export function SaveVaultDialog({
  open,
  defaultTitle,
  isUpdate,
  onOpenChange,
  onConfirm,
}: SaveVaultDialogProps): React.JSX.Element {
  const [title, setTitle] = useState(defaultTitle);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
    }
  }, [open, defaultTitle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Update vault document" : "Save to vault"}
          </DialogTitle>
          <DialogDescription>
            Your document title and .docx file are encrypted on this device
            before they are stored.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="vault-doc-title">Display title</Label>
          <Input
            id="vault-doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My document"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!title.trim()}
            onClick={() => onConfirm(title.trim())}
          >
            {isUpdate ? "Update" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
