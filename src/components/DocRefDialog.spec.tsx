import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import i18next from '../i18n/index';
import { DocRefDialog } from './DocRefDialog';

beforeEach(async () => {
  await i18next.changeLanguage('en');
});

const noop = () => {};

describe('DocRefDialog', () => {
  it('saves a web link', () => {
    const onSave = jest.fn();
    render(<DocRefDialog subject="ALLW · 2026-04-07" value={undefined} onSave={onSave} onClose={noop} />);

    fireEvent.change(screen.getByLabelText('Document URL'), { target: { value: 'https://example.com/slip.pdf' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('https://example.com/slip.pdf');
  });

  it('refuses a link that is not a web URL', () => {
    const onSave = jest.fn();
    render(<DocRefDialog subject="ALLW · 2026-04-07" value={undefined} onSave={onSave} onClose={noop} />);

    fireEvent.change(screen.getByLabelText('Document URL'), { target: { value: '/home/me/slip.pdf' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/http:\/\/ or https:\/\//)).toBeInTheDocument();
  });

  it('offers to open and remove an existing link', () => {
    const onSave = jest.fn();
    render(<DocRefDialog subject="ALLW" value="https://example.com/a.pdf" onSave={onSave} onClose={noop} />);

    expect(screen.getByRole('link', { name: 'Open document' })).toHaveAttribute('href', 'https://example.com/a.pdf');

    fireEvent.click(screen.getByRole('button', { name: 'Remove link' }));
    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('clears when saved empty', () => {
    const onSave = jest.fn();
    render(<DocRefDialog subject="ALLW" value="https://example.com/a.pdf" onSave={onSave} onClose={noop} />);

    fireEvent.change(screen.getByLabelText('Document URL'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('dismisses on Escape key and backdrop click', () => {
    const onClose = jest.fn();
    const { container } = render(<DocRefDialog subject="ALLW" onSave={noop} onClose={onClose} />);
    expect(container.querySelector('.trade-form-modal .trade-form')).not.toBeNull();
    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(container.querySelector('.trade-form-overlay')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
