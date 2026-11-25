import Image from "next/image";
import Link from "next/link";
import { NavbarClientControls } from "./NavbarClientControls";
import { NavbarAuthSkeleton } from "@/components/Skeleton";

export default function Navbar() {
  return (
    <nav className="w-full h-14 max-w-screen fixed flex top-0 border-gray-600 border-b-1 bg-background/60 backdrop-blur-sm p-2">
      <Link
        href="/"
        className="text-xl font-bold ml-5 lg:min-w-60 max-lg:min-w-10 max-xl:ml-10"
      >
        <Image
          src="/title.png"
          width={160}
          height={30}
          alt="UpYarc"
          priority
          className="-mt-2 max-lg:hidden"
        />
        <Image
          src="/icon.png"
          width={50}
          height={50}
          alt="UpYarc"
          priority
          className="lg:hidden"
        />
      </Link>

      <NavbarClientControls authFallback={<NavbarAuthSkeleton />} />
    </nav>
  );
}
