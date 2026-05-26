/* CSS is loaded via <link> in index.html head to prevent FOUC */

/* ==========================================================================
   She Can Foundation — Client-Side Interactions & Security Hardening
   Pure JavaScript, no external framework dependencies.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  let leafletMap = null; // Store map instance reference for size invalidation

  // Helper function to escape HTML tags to prevent XSS (Cross-Site Scripting)
  const escapeHTML = (str) => {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Helper function to sanitize user text input (trim and remove control chars)
  const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  };

  // Helper function to validate email structure
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  // Rate Limiting (Throttle) Helper for Form Submissions
  const makeThrottle = (delay) => {
    let lastCall = 0;
    return (callback) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        callback();
      }
    };
  };
  const submitThrottle = makeThrottle(3000); // 3-second cooldown

  // -----------------------------------------------------------------------
  // 1. Scroll Reveal — IntersectionObserver for Scroll Animations
  // -----------------------------------------------------------------------
  try {
    const animElements = document.querySelectorAll('.anim');
    if (animElements.length > 0) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);

            // Invalidate Leaflet Map Size once container finishes transition
            if (entry.target.querySelector('#map') || entry.target.id === 'map') {
              setTimeout(() => {
                if (leafletMap) {
                  leafletMap.invalidateSize();
                }
              }, 400); // Wait for transition to complete
            }
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px'
      });

      animElements.forEach(el => revealObserver.observe(el));
    }
  } catch (err) {
    console.error('Scroll reveal observer initialization failed:', err);
  }

  // -----------------------------------------------------------------------
  // 2. Fixed Sticky Navbar & Active Section Link Highlighting
  // -----------------------------------------------------------------------
  try {
    const header = document.getElementById('header');
    const backToTopBtn = document.getElementById('btt');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    let lastScrollTop = 0;

    const handleScroll = () => {
      const scrollTop = window.scrollY;

      // Toggle Sticky Header
      if (header) {
        header.classList.toggle('sticky', scrollTop > 50);

        // Smart Hiding: Hide header on scroll down, show on scroll up
        if (scrollTop > 100) {
          if (scrollTop > lastScrollTop) {
            // Scrolling down -> hide
            header.classList.add('header-hidden');
          } else {
            // Scrolling up -> show
            header.classList.remove('header-hidden');
          }
        } else {
          // Near top -> show
          header.classList.remove('header-hidden');
        }
      }

      // Toggle Back to Top Button
      if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', scrollTop > 500);
      }

      // Highlight Active Menu Item based on Scroll Position
      let currentSectionId = '';
      sections.forEach(sec => {
        const top = sec.offsetTop - 120;
        const height = sec.offsetHeight;
        if (scrollTop >= top && scrollTop < top + height) {
          currentSectionId = sec.getAttribute('id');
        }
      });

      if (currentSectionId) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${currentSectionId}`) {
            link.classList.add('active');
          }
        });
      }

      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For mobile or negative scroll elastic bounce
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on load to establish initial state
    handleScroll();

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  } catch (err) {
    console.error('Navigation scroll handler setup failed:', err);
  }

  // -----------------------------------------------------------------------
  // 3. Mobile Navigation Menu Toggle (Hamburger Menu)
  // -----------------------------------------------------------------------
  try {
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (menuToggle && navMenu) {
      const toggleMenu = () => {
        const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
        menuToggle.setAttribute('aria-expanded', !expanded);
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      };

      const closeMenu = () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      };

      menuToggle.addEventListener('click', toggleMenu);

      // Close menu when clicking links
      const navLinks = navMenu.querySelectorAll('.nav-link, .btn');
      navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
      });

      // Close menu when clicking outside of navbar area
      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target) && navMenu.classList.contains('active')) {
          closeMenu();
        }
      });
    }
  } catch (err) {
    console.error('Mobile menu toggle setup failed:', err);
  }

  // -----------------------------------------------------------------------
  // 4. Light / Dark Theme Mode
  // -----------------------------------------------------------------------
  try {
    const themeToggle = document.getElementById('theme-toggle');
    
    // Strict storage check to prevent localStorage manipulation attacks
    let savedTheme = localStorage.getItem('theme');
    if (savedTheme !== 'dark' && savedTheme !== 'light') {
      savedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    const applyTheme = (theme) => {
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggle) {
          themeToggle.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
          themeToggle.setAttribute('aria-label', 'Switch to light mode');
        }
      } else {
        document.body.classList.remove('dark-theme');
        if (themeToggle) {
          themeToggle.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
          themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
      }
    };

    applyTheme(savedTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.contains('dark-theme');
        const nextTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', nextTheme);
        applyTheme(nextTheme);
      });
    }
  } catch (err) {
    console.error('Theme toggle system failed:', err);
  }

  // -----------------------------------------------------------------------
  // 5. Stat Counter Animation (Triggers when in viewport)
  // -----------------------------------------------------------------------
  try {
    const statNums = document.querySelectorAll('.stat-num');
    if (statNums.length > 0) {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const targetVal = parseInt(el.dataset.target, 10);
            
            if (isNaN(targetVal)) return;

            const duration = 1200; // Total count animation duration in ms
            const frameRate = 1000 / 60; // 60 FPS
            const totalFrames = Math.round(duration / frameRate);
            let frame = 0;

            const animateCount = () => {
              frame++;
              const progress = frame / totalFrames;
              // Ease-out-quad function for smooth slowing at the end
              const easeVal = progress * (2 - progress);
              const currentVal = Math.floor(easeVal * targetVal);

              el.textContent = currentVal;

              if (frame < totalFrames) {
                requestAnimationFrame(animateCount);
              } else {
                el.textContent = targetVal;
              }
            };

            requestAnimationFrame(animateCount);
            observer.unobserve(el);
          }
        });
      }, { threshold: 0.6 });

      statNums.forEach(el => counterObserver.observe(el));
    }
  } catch (err) {
    console.error('Stat counter animation setup failed:', err);
  }

  // -----------------------------------------------------------------------
  // 6. Gallery Filtering & Interactive Lightbox
  // -----------------------------------------------------------------------
  try {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    // Filter Logic
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterVal = sanitizeInput(btn.dataset.filter);

        galleryItems.forEach(item => {
          if (filterVal === 'all' || item.classList.contains(filterVal)) {
            item.style.display = 'block';
            // Trigger animation frame for transition
            requestAnimationFrame(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            });
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
            // Hide element from layout after fade-out transition completes
            setTimeout(() => {
              if (item.style.opacity === '0') {
                item.style.display = 'none';
              }
            }, 300);
          }
        });
      });
    });

    // Lightbox Logic
    const lightbox = document.getElementById('lightbox');
    const lightboxClose = document.getElementById('lightbox-close');
    const lbImg = document.getElementById('lb-img');
    const lbTitle = document.getElementById('lb-title');
    const lbDesc = document.getElementById('lb-desc');

    if (lightbox && lightboxClose && lbImg) {
      const openLightbox = (item) => {
        const imgSrc = item.dataset.src;
        const imgTitle = item.dataset.title;
        const imgDesc = item.dataset.desc;

        // Verify URL format or static path format for security
        lbImg.src = imgSrc;
        lbImg.alt = escapeHTML(item.querySelector('img')?.alt || 'Enlarged gallery photo');
        
        if (lbTitle) lbTitle.textContent = imgTitle;
        if (lbDesc) lbDesc.textContent = imgDesc;

        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Lock background scrolling
      };

      const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // Restore background scrolling
        setTimeout(() => {
          lbImg.src = '';
        }, 300);
      };

      galleryItems.forEach(item => {
        item.addEventListener('click', () => openLightbox(item));
        // Keyboard support for accessibility
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') openLightbox(item);
        });
      });

      lightboxClose.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
          closeLightbox();
        }
      });
    }
  } catch (err) {
    console.error('Gallery and lightbox system failed:', err);
  }

  // -----------------------------------------------------------------------
  // 7. Interactive Testimonial Carousel
  // -----------------------------------------------------------------------
  try {
    const carousel = document.getElementById('carousel');
    const testimonials = carousel ? carousel.querySelectorAll('.testimonial') : [];
    const prevBtn = document.getElementById('c-prev');
    const nextBtn = document.getElementById('c-next');
    const dotsContainer = document.getElementById('c-dots');

    if (testimonials.length > 0) {
      let currentIndex = 0;
      let autoSlideTimer = null;

      // Build dot navigation indicators dynamically
      testimonials.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to testimonial slide ${index + 1}`);
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => navigateTo(index));
        if (dotsContainer) dotsContainer.appendChild(dot);
      });

      const dots = dotsContainer ? dotsContainer.querySelectorAll('.carousel-dot') : [];
      testimonials[0].classList.add('active');

      const updateCarouselState = () => {
        testimonials.forEach((item, index) => {
          item.classList.remove('active');
          if (dots[index]) dots[index].classList.remove('active');
        });
        testimonials[currentIndex].classList.add('active');
        if (dots[currentIndex]) dots[currentIndex].classList.add('active');
      };

      const nextSlide = () => {
        currentIndex = (currentIndex + 1) % testimonials.length;
        updateCarouselState();
      };

      const prevSlide = () => {
        currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
        updateCarouselState();
      };

      const navigateTo = (index) => {
        currentIndex = index;
        updateCarouselState();
        resetAutoSlide();
      };

      const startAutoSlide = () => {
        autoSlideTimer = setInterval(nextSlide, 5000);
      };

      const resetAutoSlide = () => {
        if (autoSlideTimer) {
          clearInterval(autoSlideTimer);
          startAutoSlide();
        }
      };

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          nextSlide();
          resetAutoSlide();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          prevSlide();
          resetAutoSlide();
        });
      }

      // Initialize auto-sliding
      startAutoSlide();

      // Pause auto-sliding on hover for readability
      carousel.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
      carousel.addEventListener('mouseleave', startAutoSlide);
    }
  } catch (err) {
    console.error('Testimonial carousel initialization failed:', err);
  }

  // -----------------------------------------------------------------------
  // 8. Leaflet Map Office Pointer (Salt Lake, Sector V, Kolkata)
  // -----------------------------------------------------------------------
  try {
    const mapContainer = document.getElementById('map');
    if (mapContainer && window.L) {
      const officeCoords = [22.5735, 88.4339];
      leafletMap = window.L.map('map', {
        center: officeCoords,
        zoom: 15,
        scrollWheelZoom: false,
        dragging: !window.L.Browser.mobile, // Disable dragging on mobile to allow scroll bypass
        tap: !window.L.Browser.mobile
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
      }).addTo(leafletMap);

      // Custom sleek divIcon marker matching the styling system
      const customIcon = window.L.divIcon({
        className: 'custom-map-marker',
        html: '<div style="width:22px; height:22px; background:linear-gradient(135deg,#7c3aed,#db2777); border:3px solid #fff; border-radius:50%; box-shadow:0 0 12px rgba(124,58,237,0.4)"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = window.L.marker(officeCoords, { icon: customIcon }).addTo(leafletMap);
      marker.bindPopup(`
        <div style="font-family:'Poppins',sans-serif; font-size:12px; color:#1a1128;">
          <strong style="color:#7c3aed; font-size:13px;">She Can Foundation</strong><br/>
          Level 4, Innovation Building, Sector V,<br/>
          Salt Lake, Kolkata 700091
        </div>
      `).openPopup();
    }
  } catch (err) {
    console.error('Leaflet map loading failed:', err);
  }

  // -----------------------------------------------------------------------
  // 9. Secure Volunteer Application Form Validation
  // -----------------------------------------------------------------------
  try {
    const form = document.getElementById('vol-form');
    const popup = document.getElementById('popup');
    const popupClose = document.getElementById('popup-close');

    const showError = (inputElement, errorElementId, message) => {
      const errSpan = document.getElementById(errorElementId);
      if (errSpan) {
        errSpan.textContent = message;
        errSpan.classList.add('visible');
      }
      inputElement.classList.add('field-invalid');
    };

    const clearErrors = () => {
      document.querySelectorAll('.field-err').forEach(span => {
        span.textContent = '';
        span.classList.remove('visible');
      });
      document.querySelectorAll('.input').forEach(input => {
        input.classList.remove('field-invalid');
      });
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Throttle submissions to prevent spamming
        submitThrottle(() => {
          clearErrors();

          // Get and sanitize input values
          const nameInput = document.getElementById('f-name');
          const emailInput = document.getElementById('f-email');
          const collegeInput = document.getElementById('f-college');
          const skillSelect = document.getElementById('f-skill');
          const reasonInput = document.getElementById('f-reason');

          const name = sanitizeInput(nameInput.value);
          const email = sanitizeInput(emailInput.value);
          const college = sanitizeInput(collegeInput.value);
          const skill = sanitizeInput(skillSelect.value);
          const reason = sanitizeInput(reasonInput.value);

          let isValid = true;

          // Validate Full Name
          if (!name) {
            showError(nameInput, 'e-name', 'Full name is required.');
            isValid = false;
          } else if (name.length < 2) {
            showError(nameInput, 'e-name', 'Please enter a valid full name.');
            isValid = false;
          } else if (name.length > 100) {
            showError(nameInput, 'e-name', 'Name must be within 100 characters.');
            isValid = false;
          }

          // Validate Email
          if (!email) {
            showError(emailInput, 'e-email', 'Email address is required.');
            isValid = false;
          } else if (!isValidEmail(email)) {
            showError(emailInput, 'e-email', 'Please enter a valid email address.');
            isValid = false;
          }

          // Validate College / University
          if (!college) {
            showError(collegeInput, 'e-college', 'College or university is required.');
            isValid = false;
          } else if (college.length < 3) {
            showError(collegeInput, 'e-college', 'Please enter a valid academic institution.');
            isValid = false;
          } else if (college.length > 150) {
            showError(collegeInput, 'e-college', 'Institution name must be within 150 characters.');
            isValid = false;
          }

          // Validate Skill Selection
          const allowedSkills = ['teaching', 'it', 'content', 'social', 'field'];
          if (!skill) {
            showError(skillSelect, 'e-skill', 'Please select your primary skill.');
            isValid = false;
          } else if (!allowedSkills.includes(skill)) {
            showError(skillSelect, 'e-skill', 'Invalid skill selection.');
            isValid = false;
          }

          // Validate Statement of Purpose
          if (!reason) {
            showError(reasonInput, 'e-reason', 'Statement of purpose is required.');
            isValid = false;
          } else if (reason.length < 20) {
            showError(reasonInput, 'e-reason', 'Please write a brief reason (minimum 20 characters).');
            isValid = false;
          } else if (reason.length > 500) {
            showError(reasonInput, 'e-reason', 'Reason must be within 500 characters.');
            isValid = false;
          }

          if (isValid) {
            const submitBtn = document.getElementById('vol-btn');
            const btnText = submitBtn.querySelector('span');
            const btnIcon = submitBtn.querySelector('i');

            // Set loading state safely
            submitBtn.disabled = true;
            if (btnText) btnText.textContent = 'Submitting...';
            if (btnIcon) btnIcon.className = 'fa-solid fa-spinner fa-spin';

            // Simulate server-side API call securely
            setTimeout(() => {
              // Reset submit button state
              submitBtn.disabled = false;
              if (btnText) btnText.textContent = 'Submit Application';
              if (btnIcon) btnIcon.className = 'fa-solid fa-paper-plane';

              form.reset();

              // Trigger success popup window safely
              if (popup) {
                popup.classList.add('active');
                popup.setAttribute('aria-hidden', 'false');
              }
            }, 1200);
          }
        });
      });
    }

    if (popupClose && popup) {
      popupClose.addEventListener('click', () => {
        popup.classList.remove('active');
        popup.setAttribute('aria-hidden', 'true');
      });
    }
  } catch (err) {
    console.error('Form validation logic failed:', err);
  }

  // -----------------------------------------------------------------------
  // 10. Newsletter Form Validation & Handling
  // -----------------------------------------------------------------------
  try {
    const nlForm = document.getElementById('nl-form');
    const nlStatus = document.getElementById('nl-status');

    if (nlForm && nlStatus) {
      nlForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const input = nlForm.querySelector('input');
        if (!input) return;

        const email = sanitizeInput(input.value);

        if (!email) {
          nlStatus.textContent = 'Email is required.';
          nlStatus.className = 'nl-status error';
        } else if (!isValidEmail(email)) {
          nlStatus.textContent = 'Please enter a valid email address.';
          nlStatus.className = 'nl-status error';
        } else {
          nlStatus.textContent = 'Successfully subscribed!';
          nlStatus.className = 'nl-status success';
          input.value = '';

          setTimeout(() => {
            nlStatus.textContent = '';
            nlStatus.className = 'nl-status';
          }, 4000);
        }
      });
    }
  } catch (err) {
    console.error('Newsletter form handling failed:', err);
  }
});
