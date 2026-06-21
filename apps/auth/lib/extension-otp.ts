import "server-only";

import { mintExtensionWeeklyProof } from "@helvety/shared/extension-weekly-proof-server";
import { z } from "zod";

import { isAllowedChromeExtensionOrigin } from "@/lib/chrome-extension-origin";
import {
  sendOtpVerificationCodeCore,
  verifyOtpCodeCore,
  type ExtensionOtpVerifySessionPayload,
} from "@/lib/otp-send-verify-core";

import type { ActionResponse } from "@helvety/shared/types/entities";

export const ExtensionOtpSendBodySchema = z.object({
  email: z.string().min(1),
  nonEUEEAConfirmed: z.literal(true),
  origin: z.string().min(1),
});

export const ExtensionOtpVerifyBodySchema = z.object({
  email: z.string().min(1),
  code: z.string().min(1),
  origin: z.string().min(1),
});

/** Successful OTP send payload returned to the Chromium extension. */
export type ExtensionOtpSendPayload = { codeSent: true };

/** Sends OTP for Chromium extension sign-in after origin + attestation checks. */
export async function sendExtensionOtp(input: {
  email: string;
  nonEUEEAConfirmed: boolean;
  origin: string;
  clientIP: string;
}): Promise<ActionResponse<ExtensionOtpSendPayload>> {
  if (!isAllowedChromeExtensionOrigin(input.origin)) {
    return {
      success: false,
      error:
        "Extension id is not allowlisted on helvety-auth (HELVETY_CHROME_EXTENSION_ORIGINS). Add the id from About → Extension ID on Vercel, then redeploy.",
    };
  }

  const result = await sendOtpVerificationCodeCore(
    input.email,
    input.clientIP,
    { nonEUEEAConfirmed: input.nonEUEEAConfirmed }
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: { codeSent: true },
  };
}

/** Verifies OTP and returns session tokens for extension `setSession`. */
export async function verifyExtensionOtp(input: {
  email: string;
  code: string;
  origin: string;
  clientIP: string;
}): Promise<ActionResponse<ExtensionOtpVerifySessionPayload>> {
  if (!isAllowedChromeExtensionOrigin(input.origin)) {
    return {
      success: false,
      error:
        "Extension id is not allowlisted on helvety-auth (HELVETY_CHROME_EXTENSION_ORIGINS). Add the id from About → Extension ID on Vercel, then redeploy.",
    };
  }

  return verifyOtpCodeCore(input.email, input.code, input.clientIP).then(
    (result) => {
      if (!result.success) {
        return result;
      }
      return {
        success: true as const,
        data: {
          ...result.data,
          weekly_proof: mintExtensionWeeklyProof(result.data.user.id),
        },
      };
    }
  );
}
