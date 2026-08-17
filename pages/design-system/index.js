import { useState } from "react";

import Alert from "components/Alert.js";
import Badge, { ClassificationBadge } from "components/Badge.js";
import Button from "components/Button.js";
import ButtonGroup from "components/ButtonGroup.js";
import Card from "components/Card.js";
import Grid from "components/Grid.js";
import Input from "components/Input.js";
import Modal from "components/Modal.js";
import PageShell from "components/PageShell.js";
import Select from "components/Select.js";
import Spinner from "components/Spinner.js";
import Stack from "components/Stack.js";
import Table from "components/Table.js";
import TextLink from "components/TextLink.js";

// Vitrine dev-only do design system (RFC 0003) — validada em viewport
// mobile e desktop antes de qualquer tela ser construída.
export function getStaticProps() {
  return {
    notFound: process.env.NODE_ENV === "production",
    props: {},
  };
}

const CLASSIFICATIONS = [
  "Abaixo do peso",
  "Peso normal",
  "Sobrepeso",
  "Obesidade grau I",
  "Obesidade grau II",
  "Obesidade grau III",
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <PageShell>
      <PageShell.Header
        title="Design system"
        subtitle="Vitrine dev-only: todos os componentes e estados num lugar só."
      />

      <PageShell.Content>
        <PageShell.Section title="Botões">
          <Card>
            <Stack gap={4}>
              <ButtonGroup>
                <Button>Primário</Button>
                <Button variant="secondary">Secundário</Button>
                <Button variant="danger">Perigo</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="ghost-danger">Ghost perigo</Button>
              </ButtonGroup>
              <ButtonGroup>
                <Button loading>Carregando</Button>
                <Button disabled>Desabilitado</Button>
                <Button href="/design-system" variant="secondary">
                  Como link
                </Button>
              </ButtonGroup>
            </Stack>
          </Card>
        </PageShell.Section>

        <PageShell.Section title="Campos de formulário">
          <Card>
            <Grid columns={2}>
              <Input label="Campo normal" placeholder="Digite algo" />
              <Input
                label="Campo com erro"
                defaultValue="valor inválido"
                error="Mensagem de erro do campo."
              />
              <Input
                label="Campo com dica"
                hint="Texto de apoio abaixo do campo."
              />
              <Input label="Campo desabilitado" disabled value="travado" />
              <Select label="Select" defaultValue="a">
                <option value="a">Opção A</option>
                <option value="b">Opção B</option>
              </Select>
              <Select label="Select com erro" error="Selecione uma opção.">
                <option>—</option>
              </Select>
            </Grid>
          </Card>
        </PageShell.Section>

        <PageShell.Section title="Badges">
          <Card>
            <Stack gap={4}>
              <ButtonGroup>
                <Badge>Neutro</Badge>
                <Badge tone="info">Info</Badge>
                <Badge tone="success">Sucesso</Badge>
                <Badge tone="warning">Alerta</Badge>
                <Badge tone="caution">Cuidado</Badge>
                <Badge tone="danger">Perigo</Badge>
              </ButtonGroup>
              <ButtonGroup>
                {CLASSIFICATIONS.map((classification) => (
                  <ClassificationBadge
                    key={classification}
                    classification={classification}
                  />
                ))}
              </ButtonGroup>
            </Stack>
          </Card>
        </PageShell.Section>

        <PageShell.Section title="Alertas">
          <Stack gap={3}>
            <Alert
              tone="danger"
              message="Algo deu errado."
              action="O que o usuário deve fazer a respeito."
            />
            <Alert tone="success" message="Operação concluída com sucesso." />
            <Alert tone="info" message="Informação contextual." />
          </Stack>
        </PageShell.Section>

        <PageShell.Section title="Tabela">
          <Table>
            <Table.Head>
              <Table.Column>Nome</Table.Column>
              <Table.Column>IMC</Table.Column>
              <Table.Column>Classificação</Table.Column>
            </Table.Head>
            <Table.Body>
              <Table.Row>
                <Table.Cell>
                  <TextLink href="/design-system">Maria Silva</TextLink>
                </Table.Cell>
                <Table.Cell>27.68</Table.Cell>
                <Table.Cell>
                  <ClassificationBadge classification="Sobrepeso" />
                </Table.Cell>
              </Table.Row>
              <Table.Empty colSpan={3}>Estado vazio da tabela.</Table.Empty>
            </Table.Body>
          </Table>
        </PageShell.Section>

        <PageShell.Section title="Modal e spinner">
          <Card>
            <ButtonGroup>
              <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
              <Spinner />
            </ButtonGroup>
          </Card>
        </PageShell.Section>
      </PageShell.Content>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Modal.Title>Título do modal</Modal.Title>
        <Modal.Description>
          Descrição da ação — foco preso, Esc fecha e o foco volta ao botão.
        </Modal.Description>
        <Modal.Actions>
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => setModalOpen(false)}>
            Confirmar
          </Button>
        </Modal.Actions>
      </Modal>
    </PageShell>
  );
}
