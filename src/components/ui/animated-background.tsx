export function AnimatedBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden bg-zinc-900">
            <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-500/20 blur-[100px] animate-blob" />
            <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[100px] animate-blob animation-delay-2000" />
            <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[100px] animate-blob animation-delay-4000" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
        </div>
    )
}
