export async function queryCameraPermission(): Promise<PermissionState | "unsupported"> {
  if (typeof navigator === "undefined" || !navigator.permissions?.query) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({
      // `camera` is not typed in older DOM libs.
      name: "camera" as PermissionName
    });

    return status.state;
  } catch {
    return "unsupported";
  }
}
