"use client";

/**
 * Inline geo-restriction confirmation step for new user registration.
 *
 * Displayed as a step in the auth flow BEFORE any user record is created in the
 * database. The user must tick the checkbox confirming they are located in
 * Switzerland and are not an EU/EEA resident before we create their account or
 * store any personal data.
 *
 * Legal basis: Helvety services are exclusively available to customers in
 * Switzerland. This self-certification establishes that Helvety does not target
 * EU/EEA customers and is therefore not subject to the GDPR (Regulation (EU)
 * 2016/679) or EU consumer protection directives. Only the Swiss Federal Act on
 * Data Protection (nDSG) applies.
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
        We show this notice for legal reasons. As a small Swiss company without
        a representative in the European Union, we are required to limit our
        services to Switzerland (Art.&nbsp;3(2) and Art.&nbsp;27, Regulation
        (EU) 2016/679 / GDPR).
      </p>

      <p className="text-foreground text-center text-sm font-medium">
        Our services are intended exclusively for customers located in
        Switzerland. We do not offer services to individuals located in the
        European Union (EU) or European Economic Area (EEA).
      </p>

      {/* Multilingual notices: Swiss national languages + major EU languages */}
      <div className="border-border bg-muted/30 space-y-1.5 rounded-lg border p-3 text-[11px]">
        <p>
          <strong>DE:</strong> Unsere Dienste sind ausschliesslich f&uuml;r
          Kunden in der Schweiz bestimmt. Wir bieten keine Dienste f&uuml;r
          Personen in der EU/EWR an.
        </p>
        <p>
          <strong>FR:</strong> Nos services sont exclusivement destin&eacute;s
          aux clients situ&eacute;s en Suisse. Nous n&apos;offrons pas de
          services aux personnes situ&eacute;es dans l&apos;UE/EEE.
        </p>
        <p>
          <strong>IT:</strong> I nostri servizi sono destinati esclusivamente ai
          clienti in Svizzera. Non offriamo servizi a persone nell&apos;UE/SEE.
        </p>
        <p>
          <strong>ES:</strong> Nuestros servicios est&aacute;n destinados
          exclusivamente a clientes en Suiza. No ofrecemos servicios a personas
          en la UE/EEE.
        </p>
        <p>
          <strong>PT:</strong> Os nossos servi&ccedil;os destinam-se
          exclusivamente a clientes na Su&iacute;&ccedil;a. N&atilde;o
          oferecemos servi&ccedil;os a pessoas na UE/EEE.
        </p>
        <p>
          <strong>NL:</strong> Onze diensten zijn uitsluitend bedoeld voor
          klanten in Zwitserland. Wij bieden geen diensten aan personen in de
          EU/EER.
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
          I confirm that I am currently located in Switzerland and am not a
          resident of the EU or EEA.
        </span>
      </label>

      {error && <p className="text-destructive text-center text-sm">{error}</p>}

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
