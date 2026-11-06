"use client";

import * as React from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { deleteAccountAction } from "@/lib/actions/settings";

export function DeleteAccountDialog({ email }: { email: string }) {
  const [open, setOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const matches = confirmation.trim().toLowerCase() === email.trim().toLowerCase();

  const remove = () => {
    startTransition(async () => {
      try {
        await deleteAccountAction();
      } catch {
        toast.error("Could not delete the account. Please try again.");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmation("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2Icon data-icon="inline-start" />
          Delete account and data
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this account?</DialogTitle>
          <DialogDescription>
            This erases every bill, reminder, subscription and ingest entry, and signs you out. It
            cannot be undone. Type <span className="font-medium text-foreground">{email}</span> to
            confirm.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          placeholder={email}
          aria-label="Type your email to confirm deletion"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={!matches || pending} onClick={remove}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {pending ? "Deleting…" : "Delete everything"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
