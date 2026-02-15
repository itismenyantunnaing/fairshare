import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/profile/certificates")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok) {
          setCertificates(data.certificates);
        }
      });
  }, []);


  