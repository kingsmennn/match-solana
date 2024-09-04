<script setup lang="ts">
const env = useRuntimeConfig().public
const effectiveDate = new Date('2024-08-01')
</script>

<template>
  <div>
    <div class="tw-bg-black">
      <div class="tw-p-6 sm:tw-p-10 tw-h-40 tw-flex tw-items-center tw-justify-center">
        <h1 class="tw-text-3xl tw-font-bold tw-text-white tw-mb-6">Terms of Use</h1>
      </div>
    </div>
    <div class="tw-max-w-7xl tw-mx-auto">
      <div class="tw-p-6 sm:tw-p-10">
        <p class="tw-text-gray-600 tw-mb-4">Effective Date: <span class="tw-font-semibold">{{ effectiveDate }}</span>
        </p>


        <p class="tw-text-gray-600 tw-mb-4">Welcome to the <span class="tw-font-semibold">{{ env.appName }}</span>
          (“the Service”). By using our platform, you agree to comply with and be bound by the following terms and
          conditions. Please read them carefully before using the Service.</p>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">1. Introduction</h2>
        <p class="tw-text-gray-600 tw-mb-4">The {{ env.appName }} web application (“the Service”) helps users find
          market items quickly by allowing them to create requests for items they need. Vendors or sellers who have the
          items can then respond to these requests, making it easier for users to obtain goods near their location.</p>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">2. Acceptance of Terms</h2>
        <p class="tw-text-gray-600 tw-mb-4">By accessing and using the Service, you accept and agree to be bound by
          these Terms of Use. If you do not agree with these terms, please refrain from using the Service.</p>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">3. Changes to Terms</h2>
        <p class="tw-text-gray-600 tw-mb-4">We reserve the right to update or modify these Terms of Use at any time
          without prior notice. Any changes will be effective immediately upon posting the updated terms. Your continued
          use of the Service constitutes your acceptance of the modified terms.</p>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">4. User Accounts</h2>
        <ul class="tw-list-disc tw-list-inside tw-text-gray-600 tw-mb-4">
          <li class="tw-mb-2"><strong>Registration:</strong> To access certain features of the Service, you may be
            required to create an account. You agree to provide accurate and complete information during registration.
          </li>
          <li class="tw-mb-2"><strong>Account Security:</strong> You are responsible for maintaining the confidentiality
            of your account credentials and for all activities that occur under your account.</li>
          <li class="tw-mb-2"><strong>Account Termination:</strong> We reserve the right to terminate or suspend your
            account at our discretion if you violate these Terms or engage in any misuse of the Service.</li>
        </ul>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">5. Use of the Service</h2>
        <ul class="tw-list-disc tw-list-inside tw-text-gray-600 tw-mb-4">
          <li class="tw-mb-2"><strong>Permitted Use:</strong> The Service is intended solely for personal,
            non-commercial use. You agree not to use the Service for any illegal, unauthorized, or harmful purposes.
          </li>
          <li class="tw-mb-2"><strong>Prohibited Activities:</strong> You agree not to:
            <ul class="tw-list-disc tw-list-inside tw-ml-6">
              <li>Interfere with or disrupt the operation of the Service.</li>
              <li>Access or use the Service in a way that could harm others or the platform’s reputation.</li>
              <li>Attempt to gain unauthorized access to any part of the Service.</li>
            </ul>
          </li>
        </ul>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">6. Location-Based Services</h2>
        <p class="tw-text-gray-600 tw-mb-4">The Service relies on location data to connect users to nearby vendors. By
          using the Service, you agree to share your location data, which is necessary to provide relevant results and
          enhance the user experience.</p>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">7. Disclaimers</h2>
        <p class="tw-text-gray-600 tw-mb-4">The Service is provided "as is" and "as available" without any warranties,
          express or implied. We do not warrant that the Service will be uninterrupted, error-free, or secure. Use of
          the Service is at your own risk.</p>

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">8. Limitation of Liability</h2>
        <p class="tw-text-gray-600 tw-mb-4">To the fullest extent permitted by law, {{ env.appName }} and its
          affiliates shall not be liable for any direct, indirect, incidental, or consequential damages arising from
          your use of the Service or inability to use the Service.</p>

        <!-- <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">9. Governing Law</h2>
        <p class="tw-text-gray-600 tw-mb-4">These Terms of Use shall be governed by and construed in accordance with the
          laws of [Your Jurisdiction]. Any disputes arising from these terms or the use of the Service shall be resolved
          in the courts of [Your Jurisdiction].</p> -->

        <h2 class="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-8 tw-mb-4">10. Contact Information</h2>
        <p class="tw-text-gray-600 tw-mb-4">If you have any questions or concerns regarding these Terms of Use, please
          contact us at <a class="tw-font-bold" :href="`mailto:${env.appContactEmail}`">{{ env.appContactEmail }}</a>
        </p>
      </div>
    </div>
  </div>
</template>