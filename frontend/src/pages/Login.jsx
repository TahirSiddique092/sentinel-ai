export default function Login() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <h1>SentinelAI</h1>
      <p>AI model security scanner</p>
      <button onClick={handleLogin}>Login with GitHub</button>
    </div>
  )
}