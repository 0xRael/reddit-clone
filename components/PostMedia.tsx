import Link from "next/link";

interface PostMediaProps {
  href: string;
  src?: string;
  alt?: string;
  fallbackText?: string;
  className?: string;
}

export function PostMedia({
  href,
  src,
  alt = "",
  className = "",
}: PostMediaProps) {
  return (
    <Link
      href={href}
      className={`relative w-full max-sm:max-h-100 sm:max-h-130 flex border-1 border-gray-700 hover:border-gray-500 overflow-hidden rounded-xl justify-center ${className}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 flex overflow-hidden -z-1"
      >
        <img
          src={src}
          alt=""
          className="w-full self-center opacity-60 blur-xl"
        />
      </div>

      <img
        src={src}
        alt={alt}
        className="max-sm:max-h-100 sm:max-h-130"
      />
    </Link>
  );
}
