"use client";

/**
 * Inline geo-restriction confirmation step for new user registration.
 *
 * Displayed as a step in the auth flow BEFORE any user record is created in the
 * database. The user must tick the checkbox confirming they are located in
 * Switzerland and are not an EU/EEA resident before we create their account.
 *
 * Legal positioning: Helvety services are intended for customers in
 * Switzerland. This self-certification supports our Swiss-focused service model
 * and helps communicate regional availability before account creation.
 *
 * The notice is displayed in English plus 6 additional languages (DE, FR, IT,
 * ES, PT, NL) to ensure EU/EEA visitors can understand the restriction.
 */

import { Button } from "@helvety/ui/button";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

/** Props for the geo-restriction confirmation step. */
interface GeoConfirmationStepProps {
  /** Whether the parent is in a loading state (e.g. creating user + sending OTP). */
  isLoading: boolean;
  /** Error message to display, if any. */
  error: string;
  /** Called when the user confirms and clicks Continue. */
  onConfirm: () => void;
  /** Called when the user clicks Back (return to email step). */
  onBack: () => void;
}

/** Geo-restriction confirmation step displayed before account creation. */
export function GeoConfirmationStep({
  isLoading,
  error,
  onConfirm,
  onBack,
}: GeoConfirmationStepProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center py-2">
        <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
          <ShieldCheck className="text-primary h-8 w-8" />
        </div>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        We show this notice for legal and service-availability reasons. Helvety
        is currently intended for customers located in Switzerland.
      </p>

      <p className="text-foreground text-center text-sm font-medium">
        Helvety currently targets customers located in Switzerland and may limit
        or decline service in certain regions, including the European Union (EU)
        and European Economic Area (EEA).
      </p>

      {/* Multilingual notices: Swiss national languages + major EU languages */}
      <div className="border-border bg-muted/30 space-y-1.5 rounded-lg border p-3 text-[11px]">
        <p>
          <strong>DE:</strong> Unsere Dienste sind derzeit haupts&auml;chlich
          f&uuml;r Kunden in der Schweiz vorgesehen. Wir vermarkten unsere
          Dienste nicht aktiv an Personen in der EU/EWR.
        </p>
        <p>
          <strong>FR:</strong> Nos services sont actuellement principalement
          destin&eacute;s aux clients situ&eacute;s en Suisse. Nous ne ciblons
          pas activement les personnes situ&eacute;es dans l&apos;UE/EEE.
        </p>
        <p>
          <strong>IT:</strong> I nostri servizi sono attualmente rivolti
          principalmente ai clienti in Svizzera. Non promuoviamo attivamente i
          servizi verso persone nell&apos;UE/SEE.
        </p>
        <p>
          <strong>ES:</strong> Nuestros servicios est&aacute;n actualmente
          orientados principalmente a clientes en Suiza. No comercializamos
          activamente servicios a personas en la UE/EEE.
        </p>
        <p>
          <strong>PT:</strong> Os nossos servi&ccedil;os destinam-se atualmente
          principalmente a clientes na Su&iacute;&ccedil;a. N&atilde;o
          comercializamos ativamente servi&ccedil;os para pessoas na UE/EEE.
        </p>
        <p>
          <strong>NL:</strong> Onze diensten zijn momenteel voornamelijk bedoeld
          voor klanten in Zwitserland. Wij richten onze diensten niet actief op
          personen in de EU/EER.
        </p>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          disabled={isLoading}
          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-current"
        />
        <span className="text-foreground text-sm font-medium">
          I confirm that I am currently located in Switzerland and understand
          service availability may be restricted for EU/EEA users.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-destructive text-center text-sm">
          {error}
        </p>
      )}

      <Button
        onClick={onConfirm}
        disabled={!checked || isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="mr-2 h-4 w-4" />
        )}
        {isLoading ? "Creating account..." : "Continue"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onBack}
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Use a different email
      </Button>
    </div>
  );
}
