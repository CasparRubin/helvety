# Image Upscaler Model Weights — Hosting Runbook

The AI engine in `apps/image-upscaler` is backed by ONNX weights served from a
public Supabase Storage bucket. This document is the operator runbook for
keeping that bucket in sync with the registry in
[`apps/image-upscaler/lib/models.ts`](../../lib/models.ts).

The browser worker fetches weights lazily on first AI run and caches them locally
via the Cache API (`upscale-models-v1`). This is typically a one-time download per
browser profile, but assets can be re-fetched after cache eviction/integrity mismatch
or when Cache API storage is unavailable. Image data never leaves the client.

## Where weights are hosted

Weights live in the public Supabase Storage bucket
[`UPSCALE_MODEL_BUCKET`](../../lib/models.ts) (`image-upscaler-models`). Each
environment (local, staging, production) reads from its **own** Supabase
project — URLs are derived from `NEXT_PUBLIC_SUPABASE_URL` at build time.

The full URL pattern for an asset is:

```
${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/image-upscaler-models/<filename>
```

## Files to upload

Upload the files using the **exact** filenames below. The `realesr-general-x4v3`
export uses the [ONNX external-data format](https://onnxruntime.ai/docs/tutorials/web/large-models.html),
which means the small `.onnx` graph references its `.data` weight sidecar by
the literal filename `real_esrgan_general_x4v3.data`. Renaming the sidecar
will break inference.

| Filename                          | Engine ID              | Size    | Scale | Notes                                                |
| --------------------------------- | ---------------------- | ------- | ----- | ---------------------------------------------------- |
| `real_esrgan_general_x4v3.onnx`   | `realesr-general-x4v3` | ~43 KB  | 4x    | Graph file (external-data format).                   |
| `real_esrgan_general_x4v3.data`   | `realesr-general-x4v3` | ~4.8 MB | 4x    | Sidecar weight tensors. **Required** alongside .onnx |

## Bucket configuration

Create the bucket once per Supabase project (Dashboard → Storage → New bucket):

| Setting              | Value                                  |
| -------------------- | -------------------------------------- |
| Name                 | `image-upscaler-models`                |
| Public bucket        | **on** (read-only is anonymous)        |
| File size limit      | optional; `10 MB` is enough for the current model pair |
| Allowed MIME types   | leave empty, or `application/octet-stream` |

CORS does not need any custom configuration — public Storage objects are
served with `Access-Control-Allow-Origin: *` by default.

## Per-file upload metadata

When uploading each file, set:

| Header           | Value                                         | Why                                                   |
| ---------------- | --------------------------------------------- | ----------------------------------------------------- |
| `Content-Type`   | `application/octet-stream`                    | Generic binary, plays well with Supabase + ORT.       |
| `Cache-Control`  | `public, max-age=31536000, immutable`         | Weights never change; aggressive cache is safe.       |

After upload, smoke-test by opening the public URLs in your browser; each
should download as a binary blob.

## Where to obtain the weights

The model is based on Real-ESRGAN by xinntao
(<https://github.com/xinntao/Real-ESRGAN>, BSD-3-Clause). The fastest path is
to use Qualcomm AI Hub's pre-converted ONNX export.

### Option A: Qualcomm AI Hub ONNX exports (recommended)

Open the Hugging Face repo, select the **Files and versions** tab, grab the
indicated files (verified against `qaihm-bot v0.53.1`), and upload them to the
bucket using the **exact** filenames above:

- <https://huggingface.co/qualcomm/Real-ESRGAN-General-x4v3>
  - `real_esrgan_general_x4v3.onnx` (~43 KB)
  - `real_esrgan_general_x4v3.data` (~4.8 MB)

### Option B: Convert the upstream PyTorch weights yourself

Download the PyTorch checkpoint from the official Real-ESRGAN releases:

- `realesr-general-x4v3.pth` -> <https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth>

Then export it to ONNX with a small Python script (requires `torch`,
`basicsr`, `realesrgan`):

```python
import torch
from basicsr.archs.srvgg_arch import SRVGGNetCompact

# Example: realesr-general-x4v3 (compact architecture).
model = SRVGGNetCompact(num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=32, upscale=4, act_type="prelu")
checkpoint = torch.load("realesr-general-x4v3.pth", map_location="cpu", weights_only=True)
model.load_state_dict(checkpoint["params"], strict=True)
model.eval()

dummy = torch.randn(1, 3, 64, 64)
torch.onnx.export(
    model,
    dummy,
    "real_esrgan_general_x4v3.onnx",
    input_names=["input"],
    output_names=["output"],
    dynamic_axes={"input": {0: "n", 2: "h", 3: "w"}, "output": {0: "n", 2: "h", 3: "w"}},
    opset_version=17,
)
```

If your exported file ends up split into a `.onnx` + `.data` pair, keep both
files and ensure the registry's `externalData` path matches the sidecar
filename embedded in the `.onnx` protobuf.

## Verify integrity (recommended)

For the current default model, SHA-256 values are already set in
[`apps/image-upscaler/lib/models.ts`](../../lib/models.ts), so runtime verification is
enforced by default.

After uploading, download the files back and compute their SHA-256 hashes:

```bash
shasum -a 256 *.onnx *.data
# or on Windows
Get-FileHash -Algorithm SHA256 *.onnx, *.data
```

Then paste the hex digests into the matching `sha256` field in
[`apps/image-upscaler/lib/models.ts`](../../lib/models.ts) — both for the
main `.onnx` (`UpscaleModel.sha256`) and for each sidecar
(`UpscaleModel.externalData[].sha256`). Once a hash is set, the worker
rejects mismatched downloads with a clear error and re-downloads on the next
attempt.

Current expected digests (must match the files uploaded to Supabase):

- `real_esrgan_general_x4v3.onnx`: `a848eba3a04de14cc5846733032c3fdc2eee175fd29df264067c3e85ab29d9b3`
- `real_esrgan_general_x4v3.data`: `512d0ec9940c2e9d85d27f2952f12a0b77b7841dc22df4ce9f3ea458bc98f37f`

## Why this folder still exists

This directory is preserved as a stable home for the runbook. It used to host
the weights as Next.js static assets in development, but now serves only as
documentation. The accompanying `.gitignore` continues to ignore stray
`*.onnx` / `*.data` files placed here so that an operator who tests against
local copies cannot accidentally commit large binaries.

## Attribution

The Real-ESRGAN model is released by xinntao under the BSD 3-Clause license.
See the upstream repository for the full notice. Helvety redistributes the
weights as static Storage assets only; no modifications are made.
