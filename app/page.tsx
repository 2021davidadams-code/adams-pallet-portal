import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  const quoteMailto =
    "mailto:dispatch@adamspalletplus.ca?subject=Request%20a%20Quote%20-%20Adams%20Pallet%20Plus&body=Company%20Name%3A%0AContact%20Name%3A%0APhone%3A%0AEmail%3A%0AService%20Needed%3A%20Pallet%20Sales%20%2F%20Custom%20Built%20Pallets%20%2F%20Wood%20Waste%20Management%20%2F%20Pallet%20Pickup%20%2F%20Digital%20Tracking%0APallet%20Size%20%2F%20Dimensions%3A%0AEstimated%20Quantity%3A%0APickup%20or%20Delivery%20Location%3A%0ADetails%3A";

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-[#1f2937]">
      <header className="sticky top-0 z-50 border-b border-[#d8cdb8] bg-[#f8f4ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="overflow-hidden rounded-2xl border border-[#d8cdb8] bg-white shadow-sm">
              <Image
                src="/adams-logo.png"
                alt="Adams Pallet Plus Inc logo"
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
            </div>

            <div>
              <p className="text-xl font-bold tracking-tight text-[#11284a]">
                Adams Pallet Plus Inc.
              </p>
              <p className="text-sm text-[#5e6470]">
                Pallet services, logistics support, and digital tracking
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#home" className="text-sm font-semibold text-[#334155] hover:text-[#11284a]">
              Home
            </a>
            <a href="#services" className="text-sm font-semibold text-[#334155] hover:text-[#11284a]">
              Services
            </a>
            <a href="#quote" className="text-sm font-semibold text-[#334155] hover:text-[#11284a]">
              Quote
            </a>
            <a href="#platform" className="text-sm font-semibold text-[#334155] hover:text-[#11284a]">
              Platform
            </a>
            <a href="#contact" className="text-sm font-semibold text-[#334155] hover:text-[#11284a]">
              Contact
            </a>
            <Link href="/dashboard" className="text-sm font-semibold text-[#334155] hover:text-[#11284a]">
              Dashboard
            </Link>
          </nav>

          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-[#cbbca3] px-4 py-2 text-sm font-semibold text-[#1f2937] hover:bg-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-[#11284a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c1d36]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section
          id="home"
          className="relative overflow-hidden border-b border-[#d8cdb8] bg-[#f5f1e8]"
        >
          <div className="absolute inset-0 opacity-30">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(17,40,74,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,40,74,0.08) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />
          </div>

          <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-[#c79a4a]/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#11284a]/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-[#d7c7aa] bg-white px-4 py-2 text-sm font-semibold text-[#7a5b36] shadow-sm">
                Pallet services and tracking tools built for real operations
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-[#11284a] sm:text-5xl lg:text-6xl">
                Pallet supply, custom builds, wood waste solutions, and digital tracking
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4b5563]">
                Adams Pallet Plus Inc. supports businesses with pallet sales,
                custom pallet builds, wood waste management, pickup requests,
                shipment coordination, and a digital platform for better visibility.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={quoteMailto}
                  className="rounded-2xl bg-[#c79a4a] px-6 py-3 font-semibold text-[#11284a] shadow-sm hover:bg-[#b98b39]"
                >
                  Request a Quote
                </a>
                <Link
                  href="/dashboard"
                  className="rounded-2xl border border-[#cbbca3] bg-white px-6 py-3 font-semibold text-[#1f2937] hover:bg-[#f8f4ec]"
                >
                  Request Pickup
                </Link>
                <Link
                  href="/signup"
                  className="rounded-2xl border border-[#cbbca3] bg-white px-6 py-3 font-semibold text-[#1f2937] hover:bg-[#f8f4ec]"
                >
                  Create Account
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#d8cdb8] bg-white p-5 shadow-sm">
                  <p className="text-sm text-[#6b7280]">Pallet Supply</p>
                  <p className="mt-2 text-2xl font-bold text-[#11284a]">Reliable</p>
                </div>

                <div className="rounded-2xl border border-[#d8cdb8] bg-white p-5 shadow-sm">
                  <p className="text-sm text-[#6b7280]">Custom Builds</p>
                  <p className="mt-2 text-2xl font-bold text-[#11284a]">Practical</p>
                </div>

                <div className="rounded-2xl border border-[#d8cdb8] bg-white p-5 shadow-sm">
                  <p className="text-sm text-[#6b7280]">Tracking Tools</p>
                  <p className="mt-2 text-2xl font-bold text-[#11284a]">Built In</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] border border-[#1d3557] bg-[#11284a] shadow-2xl">
                <div className="relative min-h-[520px] px-8 py-10 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(199,154,74,0.28),transparent_28%),linear-gradient(135deg,#11284a_0%,#0d1f38_55%,#08111d_100%)]" />
                  <div className="absolute inset-0 opacity-20">
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
                        backgroundSize: "34px 34px",
                      }}
                    />
                  </div>

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d6b77e]">
                          Adams Pallet Plus
                        </p>
                        <h2 className="mt-2 text-3xl font-bold">
                          Industrial pallet support
                        </h2>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                        Service + Platform
                      </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                      <div className="rounded-[2rem] border border-white/10 bg-white/95 p-5 shadow-xl">
                        <Image
                          src="/adams-logo.png"
                          alt="Adams Pallet Plus Inc logo"
                          width={260}
                          height={260}
                          className="h-auto w-[220px] object-contain sm:w-[260px]"
                        />
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                        <p className="text-sm text-[#dbe6f5]">Pallet Sales</p>
                        <p className="mt-2 text-2xl font-bold">Supply Ready</p>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                        <p className="text-sm text-[#dbe6f5]">Wood Waste</p>
                        <p className="mt-2 text-2xl font-bold">Managed</p>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur sm:col-span-2">
                        <p className="text-sm text-[#dbe6f5]">Digital Operations</p>
                        <p className="mt-2 text-xl font-bold">
                          Pickup requests, shipment requests, transfer numbers,
                          admin approval, reporting, and email notifications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#d8cdb8] bg-white px-5 py-4 shadow-sm">
                <p className="text-sm font-semibold text-[#7a5b36]">
                  Practical pallet services backed by a clean digital workflow.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7a5b36]">
              Services
            </p>
            <h3 className="mt-3 text-3xl font-bold text-[#11284a]">
              Pallet services for warehouses, farms, logistics teams, and industrial operations
            </h3>
            <p className="mt-3 text-[#4b5563]">
              From pallet supply to waste handling and digital tracking, Adams
              Pallet Plus helps businesses keep pallet movement organized,
              visible, and easier to manage.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-[#11284a] px-3 py-2 text-sm font-bold text-white">
                01
              </div>
              <h4 className="text-xl font-semibold text-[#11284a]">
                Pallet Sales
              </h4>
              <p className="mt-3 text-[#4b5563]">
                Supply options for businesses that need dependable pallets for
                storage, transport, warehousing, and daily shipping operations.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-[#11284a] px-3 py-2 text-sm font-bold text-white">
                02
              </div>
              <h4 className="text-xl font-semibold text-[#11284a]">
                Custom Built Pallets
              </h4>
              <p className="mt-3 text-[#4b5563]">
                Built-to-order pallet solutions for special dimensions, heavier
                loads, unique handling needs, and business-specific requirements.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-[#11284a] px-3 py-2 text-sm font-bold text-white">
                03
              </div>
              <h4 className="text-xl font-semibold text-[#11284a]">
                Wood Waste Management
              </h4>
              <p className="mt-3 text-[#4b5563]">
                Support for managing unwanted pallets, broken wood material,
                sorting, removal, reuse opportunities, and responsible disposal.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-[#11284a] px-3 py-2 text-sm font-bold text-white">
                04
              </div>
              <h4 className="text-xl font-semibold text-[#11284a]">
                Pallet Pickup & Retrieval
              </h4>
              <p className="mt-3 text-[#4b5563]">
                Request pickup support for excess, damaged, reusable, or
                unwanted pallets and keep service requests organized online.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-[#11284a] px-3 py-2 text-sm font-bold text-white">
                05
              </div>
              <h4 className="text-xl font-semibold text-[#11284a]">
                Shipment Coordination
              </h4>
              <p className="mt-3 text-[#4b5563]">
                Submit shipment requests, track quantities, manage destinations,
                and keep pallet movement records in one place.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-2xl bg-[#11284a] px-3 py-2 text-sm font-bold text-white">
                06
              </div>
              <h4 className="text-xl font-semibold text-[#11284a]">
                Digital Tracking Platform
              </h4>
              <p className="mt-3 text-[#4b5563]">
                Customer dashboards, transfer numbers, request history, admin
                review, reporting tools, and email notifications for new requests.
              </p>
            </div>
          </div>
        </section>

        <section id="quote" className="border-y border-[#d8cdb8] bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7a5b36]">
                Request a Quote
              </p>
              <h3 className="mt-3 text-3xl font-bold text-[#11284a]">
                Need pallets, a custom build, pickup service, or wood waste support?
              </h3>
              <p className="mt-4 text-[#4b5563]">
                Send the details and Adams Pallet Plus will review your request.
                Include the service needed, pallet size, quantity, and pickup or
                delivery location so we can respond with the right information.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={quoteMailto}
                  className="rounded-2xl bg-[#c79a4a] px-6 py-3 font-semibold text-[#11284a] shadow-sm hover:bg-[#b98b39]"
                >
                  Request a Quote by Email
                </a>
                <Link
                  href="/signup"
                  className="rounded-2xl border border-[#cbbca3] bg-[#f8f4ec] px-6 py-3 font-semibold text-[#1f2937] hover:bg-white"
                >
                  Create Customer Account
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#d8cdb8] bg-[#f8f4ec] p-6 shadow-sm">
              <p className="text-lg font-bold text-[#11284a]">
                Helpful quote details
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[#4b5563]">
                <div className="rounded-2xl border border-[#d8cdb8] bg-white p-4">
                  Company name and contact information
                </div>
                <div className="rounded-2xl border border-[#d8cdb8] bg-white p-4">
                  Service needed: pallet sales, custom pallets, pickup, wood waste, or tracking access
                </div>
                <div className="rounded-2xl border border-[#d8cdb8] bg-white p-4">
                  Pallet size, quantity, material condition, and timeline
                </div>
                <div className="rounded-2xl border border-[#d8cdb8] bg-white p-4">
                  Pickup or delivery location and any special instructions
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="bg-[#11284a] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d6b77e]">
                Digital Platform
              </p>
              <h3 className="mt-3 text-3xl font-bold">
                Service requests and pallet movement records in one place
              </h3>
              <p className="mt-5 max-w-2xl text-[#dbe6f5]">
                The Adams Pallet Plus portal gives customers and administrators
                a practical way to submit pickup requests, request shipments,
                review transfer numbers, and manage pallet records.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-[#dbe6f5]">Access Control</p>
                <p className="mt-2 text-xl font-bold">Admin Approval</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-[#dbe6f5]">Requests</p>
                <p className="mt-2 text-xl font-bold">Pickup & Shipment</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-[#dbe6f5]">Records</p>
                <p className="mt-2 text-xl font-bold">Transfer Numbers</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-[#dbe6f5]">Notifications</p>
                <p className="mt-2 text-xl font-bold">Email Alerts</p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7a5b36]">
              Contact
            </p>
            <h3 className="mt-3 text-3xl font-bold text-[#11284a]">
              Get in touch with Adams Pallet Plus Inc.
            </h3>
            <p className="mt-3 text-[#4b5563]">
              Contact us directly for pallet sales, custom builds, wood waste
              support, pickup service, platform access, or general business inquiries.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#7a5b36]">
                Phone
              </p>
              <a
                href="tel:+17056065293"
                className="mt-3 block text-lg font-bold text-[#11284a] hover:text-[#0c1d36]"
              >
                +1 705-606-5293
              </a>
              <p className="mt-2 text-sm text-[#6b7280]">
                Call for service inquiries and business support.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#7a5b36]">
                Email
              </p>
              <a
                href="mailto:dispatch@adamspalletplus.ca"
                className="mt-3 block text-lg font-bold text-[#11284a] hover:text-[#0c1d36]"
              >
                dispatch@adamspalletplus.ca
              </a>
              <p className="mt-2 text-sm text-[#6b7280]">
                Email us for quotes, account access, support, or general questions.
              </p>
            </div>

            <div className="rounded-3xl border border-[#d8cdb8] bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#7a5b36]">
                Address
              </p>
              <p className="mt-3 text-lg font-bold text-[#11284a]">
                912 Road 3 East
                <br />
                Kingsville, ON N9Y 2E5
              </p>
              <p className="mt-2 text-sm text-[#6b7280]">
                Adams Pallet Plus Inc. service location.
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-[#1d3557] bg-[#11284a] px-8 py-12 text-white shadow-xl">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <h4 className="text-3xl font-bold">
                  Access the platform anytime
                </h4>
                <p className="mt-4 max-w-2xl text-[#dbe6f5]">
                  Sign up for an account, log in to your user dashboard, or
                  access the admin portal to manage pallet operations digitally.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/signup"
                    className="rounded-2xl bg-[#c79a4a] px-6 py-3 font-semibold text-[#11284a] hover:bg-[#b98b39]"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
                  >
                    Login
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-[#d6b77e]">
                  Business Information
                </p>
                <div className="mt-4 space-y-3 text-sm text-[#dbe6f5]">
                  <p>
                    <span className="font-semibold text-white">Company:</span>{" "}
                    Adams Pallet Plus Inc.
                  </p>
                  <p>
                    <span className="font-semibold text-white">Phone:</span>{" "}
                    +1 705-606-5293
                  </p>
                  <p>
                    <span className="font-semibold text-white">Email:</span>{" "}
                    dispatch@adamspalletplus.ca
                  </p>
                  <p>
                    <span className="font-semibold text-white">Location:</span>{" "}
                    Kingsville, Ontario
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d8cdb8] bg-[#f8f4ec]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 text-sm text-[#5e6470] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden rounded-xl border border-[#d8cdb8] bg-white">
              <Image
                src="/adams-logo.png"
                alt="Adams Pallet Plus Inc logo"
                width={42}
                height={42}
                className="h-10 w-10 object-contain"
              />
            </div>
            <p>© 2026 Adams Pallet Plus Inc. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <a href={quoteMailto} className="hover:text-[#11284a]">
              Request Quote
            </a>
            <a href="tel:+17056065293" className="hover:text-[#11284a]">
              +1 705-606-5293
            </a>
            <a href="mailto:dispatch@adamspalletplus.ca" className="hover:text-[#11284a]">
              dispatch@adamspalletplus.ca
            </a>
            <Link href="/login" className="hover:text-[#11284a]">
              Login
            </Link>
            <Link href="/signup" className="hover:text-[#11284a]">
              Sign Up
            </Link>
            <Link href="/dashboard" className="hover:text-[#11284a]">
              Dashboard
            </Link>
            <Link href="/admin" className="hover:text-[#11284a]">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}