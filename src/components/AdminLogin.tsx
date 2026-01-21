'use client'

import { useAuth } from "@/context/AuthContext"
import { GovButton, GovFormControl, GovFormInput, GovFormLabel } from "@gov-design-system-ce/react"
import { useState } from "react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [invalid, setInvalid] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setInvalid(false);
    setLoading(true)

    try {
      await signIn(email, password);
    } catch (error) {
      console.error("Login failed:", error);
      setInvalid(true);
    }
    setLoading(false)
  }

  return (
    <div className="w-screen h-screen grid justify-center items-center">
      <div className="grid gap-4">
        <span className="text-3xl font-bold text-center">Zadejte admin údaje</span>
        <form onSubmit={handleLogin} className="grid gap-2 w-full">

          <GovFormControl>
            <GovFormLabel>Email</GovFormLabel>
            <GovFormInput
              type="email"
              invalid={invalid}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (invalid) setInvalid(false);
              }}
              size="m"
            >
            </GovFormInput>
          </GovFormControl>

          <GovFormControl>
            <GovFormLabel>Heslo</GovFormLabel>
            <GovFormInput
              invalid={invalid}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (invalid) setInvalid(false);
              }}
              size="m"
            >
            </GovFormInput>
          </GovFormControl>

          <div className="flex pt-2 justify-center">
            <GovButton
              disabled={loading}
              className=""
              color="primary"
              type="solid"
              nativeType="submit"
            >
              Přihlásit
            </GovButton>
          </div>

        </form>
      </div>
    </div>
  )
}
