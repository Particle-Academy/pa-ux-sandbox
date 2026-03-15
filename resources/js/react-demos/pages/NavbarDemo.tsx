import { Navbar } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function NavbarDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Navbar</h1>

      <DemoSection title="Basic" description="A responsive navigation bar component." code={`<Navbar>
  <Navbar.Brand><span>MyApp</span></Navbar.Brand>
  <Navbar.Items>
    <Navbar.Item href="#">Home</Navbar.Item>
    <Navbar.Item href="#">About</Navbar.Item>
  </Navbar.Items>
</Navbar>`}>
        <Navbar className="rounded-lg">
          <Navbar.Brand>
            <span className="text-lg font-bold">MyApp</span>
          </Navbar.Brand>
          <Navbar.Items>
            <Navbar.Item href="#">Home</Navbar.Item>
            <Navbar.Item href="#">About</Navbar.Item>
            <Navbar.Item href="#">Services</Navbar.Item>
            <Navbar.Item href="#">Contact</Navbar.Item>
          </Navbar.Items>
        </Navbar>
      </DemoSection>

      <DemoSection title="With Toggle" description="Mobile-responsive navbar with hamburger menu." code={`<Navbar>
  <Navbar.Brand><span>Dashboard</span></Navbar.Brand>
  <Navbar.Toggle />
  <Navbar.Items>
    <Navbar.Item href="#">Overview</Navbar.Item>
    <Navbar.Item href="#">Settings</Navbar.Item>
  </Navbar.Items>
</Navbar>`}>
        <Navbar className="rounded-lg">
          <Navbar.Brand>
            <span className="text-lg font-bold">Dashboard</span>
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Items>
            <Navbar.Item href="#">Overview</Navbar.Item>
            <Navbar.Item href="#">Analytics</Navbar.Item>
            <Navbar.Item href="#">Settings</Navbar.Item>
          </Navbar.Items>
        </Navbar>
      </DemoSection>
    </div>
  );
}
