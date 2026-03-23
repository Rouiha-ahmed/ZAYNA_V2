import Container from "./Container";
import Logo from "./Logo";
import MobileMenu from "./MobileMenu";
import HeaderDesktopNav from "./HeaderDesktopNav";
import { getStorefrontShellData } from "@/lib/storefront";

const Header = async () => {
  const shell = await getStorefrontShellData();

  return (
    <header className="sticky top-0 z-50 border-b border-shop_light_green/15 bg-white/75 py-3.5 backdrop-blur-xl">
      <Container className="flex items-center justify-between gap-3 text-lightColor lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <MobileMenu
            links={shell.headerLinks}
            categories={shell.navigationCategories}
            socialLinks={shell.socialLinks}
          />
          <Logo />
        </div>
        <HeaderDesktopNav />
      </Container>
    </header>
  );
};

export default Header;
