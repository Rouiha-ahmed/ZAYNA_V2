import Image from 'next/image'
import logo from "./image/Logo.jpeg";
import Link from 'next/link'
import React from 'react'

const Logo = () => {
  return (
    <Link href={"/"} className='inline-flex'>
        <Image src={logo} alt="Zayna online store" width={150} height={50} />
    </Link>
  )
}

export default Logo