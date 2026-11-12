import React, { useState } from 'react';
import { filterCustomers } from './customer-data';
import { visitTime } from './walk-in-visits';
import { walkInError } from './walk-in-data';

export function CustomerDirectory({ customers, openVisits, onNewWalkIn, onCheckIn, onCheckout, onArchive }) {
  const [scope, setScope] = useState('active');
  const [search, setSearch] = useState('');
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState('');
  const [archiveSuccess, setArchiveSuccess] = useState('');
  const visits = new Map(openVisits.records?.map(visit => [visit.customerId, visit]));
  const visibleCustomers = filterCustomers(customers, search)
    .filter(customer => scope === 'all' || visits.has(customer.id));

  async function confirmArchive() {
    if (archiving) return;
    setArchiving(true);
    setArchiveError('');
    try {
      await onArchive(archiveTarget.id);
      setArchiveSuccess(archiveTarget.fullName + ' archived.');
      setArchiveTarget(null);
    } catch (error) {
      setArchiveError(walkInError(error));
    } finally {
      setArchiving(false);
    }
  }

  return (
    <section className="walk-in-panel customer-directory" aria-labelledby="customer-directory-title">
      <div className="directory-header">
        <div>
          <h1 id="customer-directory-title">Customers</h1>
          <p>See who’s in the gym and find returning customers.</p>
        </div>
        <button type="button" className="walk-in-primary" onClick={onNewWalkIn}>New walk-in</button>
      </div>
      {archiveSuccess && <p className="walk-in-success" role="status">{archiveSuccess}</p>}
      {archiveTarget && (
        <section className="walk-in-form" aria-labelledby="archive-customer-title">
          <h2 id="archive-customer-title">Archive {archiveTarget.fullName}?</h2>
          <p>The customer will leave the directory. Their visits and payments will remain in history.</p>
          {archiveError && <p className="walk-in-error" role="alert">{archiveError}</p>}
          <div className="walk-in-mode">
            <button type="button" disabled={archiving} onClick={() => setArchiveTarget(null)}>Cancel</button>
            <button type="button" disabled={archiving} onClick={confirmArchive}>{archiving ? 'Archiving…' : 'Confirm archive'}</button>
          </div>
        </section>
      )}
      <div className="directory-controls">
        <div className="walk-in-mode" role="group" aria-label="Filter customers">
          <button type="button" aria-pressed={scope === 'active'} onClick={() => setScope('active')}>
            In gym{openVisits.records && ` (${openVisits.records.length})`}
          </button>
          <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>
            All customers ({customers.length})
          </button>
        </div>
        <input type="search" aria-label="Search customers by name or ID" placeholder="Search by name or ID"
          value={search} onChange={event => setSearch(event.target.value)} />
      </div>
      {openVisits.error && (
        <div className="directory-controls">
          <p className="walk-in-error" role="alert">{openVisits.error}</p>
          <button type="button" onClick={openVisits.retry}>Retry visit status</button>
        </div>
      )}
      {!openVisits.records && !openVisits.error && <p role="status">Loading visit status…</p>}
      {(scope === 'all' || openVisits.records) && visibleCustomers.length === 0 && (
        <p className="directory-empty">
          {search.trim() ? 'No customers match your search.'
            : scope === 'active' ? 'No customers are checked in.' : 'No customers have been registered.'}
        </p>
      )}
      {visibleCustomers.length > 0 && (
        <ul className="directory-list">
          {visibleCustomers.map(customer => {
            const visit = visits.get(customer.id);
            return (
              <li key={customer.id}>
                <div className="directory-identity">
                  <strong>{customer.fullName}</strong>
                  {scope === 'all' && (
                    <>
                      {customer.phone && <small>{customer.phone}</small>}
                      {customer.email && <small>{customer.email}</small>}
                      <small>ID {customer.id}</small>
                    </>
                  )}
                </div>
                <div className="directory-status">
                  {openVisits.records && (
                    <span className={visit ? 'directory-in-gym' : undefined}>{visit ? 'In gym' : 'Not checked in'}</span>
                  )}
                  {visit && <small>Checked in {visitTime(visit.checkedInAt)}</small>}
                </div>
                {openVisits.records && (
                  <div className="walk-in-mode">
                  <button type="button" onClick={() => visit ? onCheckout(visit) : onCheckIn(customer)}
                    aria-label={(visit ? 'Check out ' : 'Check in ') + customer.fullName}>
                    {visit ? 'Check out' : 'Check in'}
                  </button>
                  {scope === 'all' && !visit && (
                    <button type="button" disabled={archiving} aria-label={'Archive ' + customer.fullName} onClick={() => {
                      setArchiveTarget(customer);
                      setArchiveError('');
                      setArchiveSuccess('');
                    }}>Archive</button>
                  )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
