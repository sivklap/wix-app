import React, { useState } from 'react';
import { Button, Input, Page, WixDesignSystemProvider } from '@wix/design-system';
import { createContact, updateContact, getContact } from './contacts-api'; 

export default function ManageContactsPage() {
  const [contactId, setContactId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const handleCreateContact = async () => {
    await createContact({ firstName, lastName, email });
  };

  return (
    <WixDesignSystemProvider>
      <Page>
        <Page.Header title="Manage Contacts" />
        <Page.Content>
          <Input placeholder="First Name" onChange={(e) => setFirstName(e.target.value)} />
          <Input placeholder="Last Name" onChange={(e) => setLastName(e.target.value)} />
          <Input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={handleCreateContact}>Create Contact</Button>
        </Page.Content>
      </Page>
    </WixDesignSystemProvider>
  );
}
