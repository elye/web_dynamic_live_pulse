import { useEffect, useState } from "react";

/** The participant join link; on localhost it uses the LAN address so phones can reach it. */
export function useJoinUrl(code: string) {
  const [origin, setOrigin] = useState(window.location.origin);
  useEffect(() => {
    if (["localhost", "127.0.0.1"].includes(window.location.hostname))
      fetch("/api/network")
        .then((response) => response.json())
        .then(({ address }) => {
          if (address)
            setOrigin(
              `${window.location.protocol}//${address}:${window.location.port}`,
            );
        })
        .catch(() => {});
  }, []);
  return `${origin}/join?code=${code}`;
}
