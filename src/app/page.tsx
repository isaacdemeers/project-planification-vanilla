import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  redirect("/login");
  // return (
  //   <div>
  //     <Link href="/dashboard">Dashboard</Link>
  //   </div>
  // );
}
