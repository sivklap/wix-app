import { contacts } from '@wix/crm';

export async function createContact() {
  const contactInfo = {
    name: { first: 'John', last: 'Doe' },
    emails: { items: [{ email: 'johndoe@example.com', primary: true }] },
    phones: { items: [{ phone: '+1234567890', primary: true, tag: 'MOBILE' }] },
  };

  try {
    const newContact = await contacts.createContact(contactInfo);
    console.log('Contact created successfully:', newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
  }
}

export async function updateContact(contactId, revision) {
  const updatedInfo = {
    name: { first: 'Jane', last: 'Doe' },
    phones: { items: [{ phone: '+9876543210', primary: true, tag: 'WORK' }] },
  };

  try {
    const updatedContact = await contacts.updateContact(contactId, updatedInfo, revision);
    console.log('Contact updated successfully:', updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
  }
}

export async function getContact(contactId) {
  try {
    const contact = await contacts.getContact(contactId);
    console.log('Contact details:', contact);
  } catch (error) {
    console.error('Error retrieving contact:', error);
  }
}

