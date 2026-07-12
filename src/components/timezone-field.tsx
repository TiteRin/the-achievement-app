"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

function getClientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerTimezone(): string {
  return "UTC";
}

export function TimezoneField() {
  const timezone = useSyncExternalStore(
    noopSubscribe,
    getClientTimezone,
    getServerTimezone
  );

  return <input type="hidden" name="timezone" value={timezone} />;
}
