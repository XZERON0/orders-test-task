"use client";

import { useEffect, useState } from "react";
import { getToken, setToken, USERS } from "@/lib/api";

/** Переключатель «войти как»: вместо настоящего входа в тестовом проекте. */
export function UserSwitcher() {
  const [token, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    setCurrent(getToken());
  }, []);

  if (token === null) return null;

  return (
    <select
      value={token}
      onChange={(event) => {
        setToken(event.target.value);
        window.location.reload();
      }}
    >
      {USERS.map((user) => (
        <option key={user.token} value={user.token}>
          {user.label}
        </option>
      ))}
    </select>
  );
}
