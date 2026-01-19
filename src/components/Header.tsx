import * as texts from "@/lib/texts.json";
import Image from "next/image";
import Link from "next/link";

export default function Header() {

  return (
    <div className="px-2 md:px-16 py-4 bg-white flex justify-between items-center w-full">
      <Link href="/" style={{ "textDecoration": "none" }} >
        <div className="flex justify-center items-center">
          <Image width={58} height={40} alt="logo" src={"/logo.png"}></Image>
          <h6 className="text-[#1E5086]">{texts.page_title}</h6>
        </div>
      </Link>
    </div>
  )
}
