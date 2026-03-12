import { Table } from "@fancy/react";
import { DemoSection } from "../components/DemoSection";

const users = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor" },
  { id: 3, name: "Carol White", email: "carol@example.com", role: "Viewer" },
  { id: 4, name: "Dan Brown", email: "dan@example.com", role: "Editor" },
  { id: 5, name: "Eve Davis", email: "eve@example.com", role: "Admin" },
];

export function TableDemo() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Table</h1>

      <DemoSection
        title="Compound Table"
        description="Table with sortable columns, search, and pagination."
      >
        <Table>
          <Table.Tray>
            <Table.Search placeholder="Search users..." />
          </Table.Tray>
          <table className="w-full">
            <Table.Head>
              <Table.Row>
                <Table.Column label="Name" sortKey="name" />
                <Table.Column label="Email" sortKey="email" />
                <Table.Column label="Role" />
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>{user.name}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>{user.role}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </table>
          <Table.Pagination total={users.length} pageSize={10} />
        </Table>
      </DemoSection>
    </div>
  );
}
