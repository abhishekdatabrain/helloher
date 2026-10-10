let lastNotificationTime = 0;
let lastNotificationTitle = "";

export const askNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications.");
    return false;
  }

  const currentPermission = Notification.permission;

  if (currentPermission === "granted") return true;
  if (currentPermission === "denied") {
    console.log("Notifications are denied by user.");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (err) {
    console.log("Notification permission request failed:", err);
    return false;
  }
};

export const showBrowserNotification = (
  title: string,
  body: string,
  options?: {
    icon?: string;
    tag?: string;
    silent?: boolean;
    onClick?: () => void;
  }
) => {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    console.log("Notification permission not granted.");
    return;
  }

  const now = Date.now();

  // Prevent duplicate spammy notifications
  if (
    title === lastNotificationTitle &&
    now - lastNotificationTime < 3000 // 3s cooldown
  ) {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: options?.icon || "/icon-512.png",
    tag: options?.tag || undefined,
    silent: options?.silent || false,
  });

  if (options?.onClick) {
    notification.onclick = (e) => {
      e.preventDefault();
      options.onClick?.();
    };
  }

  lastNotificationTime = now;
  lastNotificationTitle = title;
};
