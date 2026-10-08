import Swal from 'sweetalert2';

// SweetAlert2 follows the app theme (light / dark from the OS) through the .swal2-* rules in index.css,
// so no colors are set here.
export const swal = Swal.mixin({ reverseButtons: true });

const swalToast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer);
    el.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const notify = (ok, text) => swalToast.fire({ icon: ok ? 'success' : 'error', title: text });

// Destructive confirmation; resolves true only when the user confirms.
export const confirmDanger = async (title, text, confirmButtonText = 'Ya, hapus aja') =>
  (
    await swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Nggak jadi',
      customClass: { confirmButton: 'is-danger' },
      focusCancel: true,
    })
  ).isConfirmed;
