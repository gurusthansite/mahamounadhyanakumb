import React, { useState } from 'react';

type PolicyType = 'privacy' | 'terms' | 'refund' | 'shipping' | 'contact' | null;

export const ComplianceFooter: React.FC = () => {
  const [activeModal, setActiveModal] = useState<PolicyType>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <footer className="mt-16 border-t border-[#8b3d0b]/40 bg-[#1e0a03]/90 text-orange-100/80 pt-10 pb-8 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#8b3d0b]/30">
          
          {/* Organization Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-white text-base tracking-wide">
                Vasudhaika Foundation
              </span>
            </div>
            <p className="text-xs text-orange-200/70 leading-relaxed mb-3">
              Gurusthan Pyramid Meditation Space — Dedicated to free pyramid meditation, spiritual wisdom inspired by Brahmarshi Patriji, and Guru Prasadam (Annadanam) Seva.
            </p>
            <p className="text-xs text-orange-200/60 leading-relaxed">
              📍 H.No 88-2RT, Street No-3, Near Metro Pillar No-1033, S.R. Nagar Metro Station, S.R. Nagar, Hyderabad, Telangana - 500038
            </p>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffca08] mb-3">
              Contact & Support
            </h4>
            <ul className="space-y-2 text-xs text-orange-200/80">
              <li className="flex items-center gap-2">
                <span className="text-[#ffca08]">📞</span>
                <a href="tel:9133014014" className="hover:text-white transition-colors">
                  +91 9133014014, +91 9133015015
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ffca08]">💬</span>
                <a href="https://wa.me/919133017017" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: +91 919133017017
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#ffca08]">✉️</span>
                <a href="mailto:gurusthan.meditation@gmail.com" className="hover:text-white transition-colors">
                  gurusthan.meditation@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <span className="text-[#ffca08]">🌐</span>
                <a href="https://gurusthanmeditation.org" target="_blank" rel="noopener noreferrer" className="text-[#ffca08] hover:underline font-medium">
                  gurusthanmeditation.org
                </a>
              </li>
            </ul>
          </div>

          {/* Mandatory Compliance Policies */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#ffca08] mb-3">
              Policies & Legal
            </h4>
            <div className="flex flex-col space-y-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveModal('terms')}
                className="text-left text-orange-200/80 hover:text-[#ffca08] transition-colors cursor-pointer"
              >
                • Terms & Conditions
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('privacy')}
                className="text-left text-orange-200/80 hover:text-[#ffca08] transition-colors cursor-pointer"
              >
                • Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('refund')}
                className="text-left text-orange-200/80 hover:text-[#ffca08] transition-colors cursor-pointer"
              >
                • Refund & Cancellation Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('shipping')}
                className="text-left text-orange-200/80 hover:text-[#ffca08] transition-colors cursor-pointer"
              >
                • Shipping & Delivery Policy
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('contact')}
                className="text-left text-orange-200/80 hover:text-[#ffca08] transition-colors cursor-pointer"
              >
                • Contact Us
              </button>
            </div>
          </div>

        </div>

        {/* Footer Bottom credits */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-orange-200/50">
          <p>© {new Date().getFullYear()} Vasudhaika Foundation · Gurusthan Meditation</p>
          <p className="text-[11px] tracking-wide text-orange-200/60">
            A Movement of Mouna · Tiruvannamalai
          </p>
        </div>
      </div>

      {/* Compliance Policies Modal */}
      {activeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            className="bg-[#240b03] border border-[#ffca08]/40 rounded-2xl max-w-2xl w-full p-6 text-orange-100 max-h-[85vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-orange-200/60 hover:text-white text-2xl font-bold leading-none p-1"
              aria-label="Close"
            >
              &times;
            </button>

            {/* Terms and Conditions */}
            {activeModal === 'terms' && (
              <div>
                <h3 className="text-xl font-bold text-[#ffca08] mb-3">Terms and Conditions</h3>
                <p className="text-xs text-orange-200/70 mb-4">Last updated: October 2026</p>
                <div className="space-y-3 text-sm text-orange-200/90 leading-relaxed">
                  <p>
                    Welcome to the <strong>Mahamouna Dhyanakumbh & Annaprasadam Seva</strong> portal, operated by <strong>Vasudhaika Foundation</strong> (&quot;Foundation&quot;, &quot;we&quot;, &quot;our&quot;). By accessing our website, generating posters, or contributing to Annaprasadam Seva, you agree to these Terms and Conditions.
                  </p>
                  <h4 className="font-bold text-white pt-2">1. Purpose of Service</h4>
                  <p>
                    This platform allows devotees and volunteers to generate personalized event invitation posters, participate in Annaprasadam Seva (food distribution), and support charitable spiritual gatherings.
                  </p>
                  <h4 className="font-bold text-white pt-2">2. User Content & Photo Upload</h4>
                  <p>
                    Users must ensure that photos and personal details (name, phone number) provided are accurate and do not violate third-party intellectual property or privacy rights.
                  </p>
                  <h4 className="font-bold text-white pt-2">3. Online Contributions</h4>
                  <p>
                    All online contributions are processed securely through certified payment gateways (Razorpay). Amounts contributed towards Annaprasadam Seva are dedicated strictly towards food distribution and event organizing by Vasudhaika Foundation.
                  </p>
                  <h4 className="font-bold text-white pt-2">4. Governing Law</h4>
                  <p>
                    These terms are governed by the laws of India. Any disputes arising shall be subject to the jurisdiction of the courts in Hyderabad, Telangana.
                  </p>
                </div>
              </div>
            )}

            {/* Privacy Policy */}
            {activeModal === 'privacy' && (
              <div>
                <h3 className="text-xl font-bold text-[#ffca08] mb-3">Privacy Policy</h3>
                <p className="text-xs text-orange-200/70 mb-4">Last updated: October 2026</p>
                <div className="space-y-3 text-sm text-orange-200/90 leading-relaxed">
                  <p>
                    <strong>Vasudhaika Foundation</strong> respects your privacy. This Privacy Policy describes how we collect, use, and protect your information when you use our website.
                  </p>
                  <h4 className="font-bold text-white pt-2">1. Information We Collect</h4>
                  <p>
                    We collect your full name, phone number, location, and uploaded photo strictly to generate your customized poster and send relevant event / seva updates.
                  </p>
                  <h4 className="font-bold text-white pt-2">2. Payment Security</h4>
                  <p>
                    We do NOT store or process your debit/credit card numbers, UPI PINs, or net banking passwords. All payment transactions are handled directly through <strong>Razorpay</strong>, which complies with PCI-DSS payment security standards.
                  </p>
                  <h4 className="font-bold text-white pt-2">3. Data Sharing</h4>
                  <p>
                    We do not sell, rent, or trade your personal information to third parties. Information is used solely for the foundation&apos;s charitable and spiritual activities.
                  </p>
                  <h4 className="font-bold text-white pt-2">4. Contact Us</h4>
                  <p>
                    For privacy questions, please email us at <strong>gurusthan.meditation@gmail.com</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Refund and Cancellation Policy */}
            {activeModal === 'refund' && (
              <div>
                <h3 className="text-xl font-bold text-[#ffca08] mb-3">Refund & Cancellation Policy</h3>
                <p className="text-xs text-orange-200/70 mb-4">Last updated: October 2026</p>
                <div className="space-y-3 text-sm text-orange-200/90 leading-relaxed">
                  <h4 className="font-bold text-white pt-1">1. Voluntary Charitable Contributions</h4>
                  <p>
                    All contributions made towards <strong>Annaprasadam Seva</strong> (₹1 per plate) are voluntary charitable donations to <strong>Vasudhaika Foundation</strong> to feed devotees and pilgrims at Arunachalam Mahamouna Dhyanakumbham.
                  </p>
                  <h4 className="font-bold text-white pt-2">2. Non-Refundable Policy</h4>
                  <p>
                    Because contributions are immediately allocated towards food procurement and seva arrangements, donations once completed are strictly <strong>non-refundable</strong> and cannot be cancelled.
                  </p>
                  <h4 className="font-bold text-white pt-2">3. Failed or Duplicate Transactions</h4>
                  <p>
                    If an amount is debited from your bank account or card but the transaction fails or shows an error, the deducted amount is automatically refunded by your issuing bank within <strong>5 to 7 business days</strong> as per standard banking protocol.
                  </p>
                  <h4 className="font-bold text-white pt-2">4. Support & Grievances</h4>
                  <p>
                    In case of double debit or any transaction issues, please email your payment receipt and Razorpay Payment ID to <strong>gurusthan.meditation@gmail.com</strong> or contact <strong>+91 9133014014</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Shipping & Delivery Policy */}
            {activeModal === 'shipping' && (
              <div>
                <h3 className="text-xl font-bold text-[#ffca08] mb-3">Shipping & Delivery Policy</h3>
                <p className="text-xs text-orange-200/70 mb-4">Last updated: October 2026</p>
                <div className="space-y-3 text-sm text-orange-200/90 leading-relaxed">
                  <h4 className="font-bold text-white pt-1">1. Digital Service Nature</h4>
                  <p>
                    This platform provides online digital poster generation and spiritual Annaprasadam Seva donation services. <strong>No physical goods are manufactured or shipped.</strong>
                  </p>
                  <h4 className="font-bold text-white pt-2">2. Instant Fulfillment</h4>
                  <p>
                    Upon completing your seva contribution or entering your details, your customized poster is rendered immediately on screen. You can instantly share or download the high-resolution poster directly to your device or WhatsApp.
                  </p>
                  <h4 className="font-bold text-white pt-2">3. Delivery Timeline</h4>
                  <p>
                    Digital delivery is instantaneous (0 to 60 seconds). If you experience technical delays, you can regenerate your poster at any time without additional charges.
                  </p>
                </div>
              </div>
            )}

            {/* Contact Us */}
            {activeModal === 'contact' && (
              <div>
                <h3 className="text-xl font-bold text-[#ffca08] mb-3">Contact Us</h3>
                <div className="space-y-3 text-sm text-orange-200/90 leading-relaxed">
                  <p>
                    For inquiries, seva coordination, or support regarding the Mahamouna Dhyanakumbh & Annaprasadam Seva, please reach out to us:
                  </p>
                  <div className="bg-[#1a0802] p-4 rounded-xl border border-[#8b3d0b]/40 space-y-2 mt-2">
                    <p><strong>Organization:</strong> Vasudhaika Foundation (Gurusthan Meditation)</p>
                    <p><strong>Address:</strong> Gurusthan Pyramid Meditation Space, H.No 88-2RT, Street No-3, Near Metro Pillar No-1033, S.R. Nagar Metro Station, S.R. Nagar, Hyderabad, Telangana - 500038, India.</p>
                    <p><strong>Phone:</strong> +91 9133014014 / +91 9133015015</p>
                    <p><strong>WhatsApp:</strong> +91 919133017017</p>
                    <p><strong>Email:</strong> gurusthan.meditation@gmail.com</p>
                    <p><strong>Official Website:</strong> <a href="https://gurusthanmeditation.org" target="_blank" rel="noopener noreferrer" className="text-[#ffca08] hover:underline">https://gurusthanmeditation.org</a></p>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-[#8b3d0b]/40 flex justify-between items-center">
              <a
                href="https://gurusthanmeditation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#ffca08] hover:underline flex items-center gap-1 font-medium"
              >
                Visit Official Gurusthan Portal →
              </a>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-[#ffca08] text-[#381609] font-bold rounded-lg text-xs hover:bg-[#e6b507] transition-all cursor-pointer shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
