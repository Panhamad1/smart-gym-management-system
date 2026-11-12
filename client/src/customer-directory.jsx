import React, { useState } from 'react';
import { filterCustomers } from './customer-data';
import { visitTime } from './walk-in-visits';

export function CustomerDirectory({ customers, openVisits, onNewWalkIn, onCheckIn, onCheckout }) {
  const [scope, setScope] = useState('active');
  const [search, setSearch] = useState('');
  const visits = new Map(openVisits.records?.map(visit => [visit.customerId, visit]));
  const visibleCustomers = filterCustomers(customers, search)
    .filter(customer => scope === 'all' || visits.has(customer.id));

  return (
    <section className="walk-in-panel customer-directory" aria-labelledby="customer-directory-title">
      <div className="directory-header">
        <div>
          <h1 id="customer-directory-title">Customers</h1>
          <p>See who’s in the gym and find returning customers.</p>
        </div>
        <button type="button" className="walk-in-primary" onClick={onNewWalkIn}>New walk-in</button>
      </div>
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
                  <button type="button" onClick={() => visit ? onCheckout(visit) : onCheckIn(customer)}
                    aria-label={(visit ? 'Check out ' : 'Check in ') + customer.fullName}>
                    {visit ? 'Check out' : 'Check in'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
